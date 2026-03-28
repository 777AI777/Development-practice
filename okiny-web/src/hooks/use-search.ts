"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePageTransition } from "@/components/page-transition-provider";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";

interface UseSearchOptions<TItem> {
  fetcher: (
    query: string,
    cursor: string | null,
    signal: AbortSignal,
  ) => Promise<{ items: TItem[]; nextCursor: string | null }>;
  debounceMs?: number;
  minQueryLength?: number;
}

interface UseSearchReturn<TItem> {
  items: TItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  isInitialized: boolean;
  loadMore: () => void;
  reset: () => void;
  refresh: () => Promise<void>;
}

export function useSearch<TItem>({
  fetcher,
  debounceMs = SEARCH_DEBOUNCE_MS,
  minQueryLength = 1,
}: UseSearchOptions<TItem>): {
  search: (query: string) => void;
} & UseSearchReturn<TItem> {
  const [items, setItems] = useState<TItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { startTransitionLoading, signalReady } = usePageTransition();

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const cursorRef = useRef<string | null>(null);
  const queryRef = useRef("");
  const transitionActiveRef = useRef(false);
  const cacheRef = useRef<Map<string, { items: TItem[]; nextCursor: string | null }>>(
    new Map(),
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      abortRef.current?.abort();
    };
  }, []);

  const fetchPage = useCallback(
    async (query: string, cursor: string | null, isMore: boolean) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (isMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const result = await fetcher(query, cursor, controller.signal);

        if (isMore) {
          let mergedItems: TItem[] = [];
          setItems((prev) => {
            mergedItems = [...prev, ...result.items];
            return mergedItems;
          });
          cacheRef.current.set(query, {
            items: mergedItems,
            nextCursor: result.nextCursor,
          });
        } else {
          setItems(result.items);
          cacheRef.current.set(query, {
            items: result.items,
            nextCursor: result.nextCursor,
          });
        }

        cursorRef.current = result.nextCursor;
        setHasMore(result.nextCursor !== null);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setError("検索に失敗しました");
        if (!isMore) {
          setItems([]);
          setHasMore(false);
        }
      } finally {
        abortRef.current = null;
        if (isMore) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
          if (transitionActiveRef.current) {
            transitionActiveRef.current = false;
            signalReady();
          }
        }
        setIsInitialized(true);
      }
    },
    [fetcher, signalReady],
  );

  const search = useCallback(
    (query: string) => {
      const trimmedQuery = query.trim();

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = undefined;
      }

      abortRef.current?.abort();
      abortRef.current = null;
      queryRef.current = trimmedQuery;

      if (!trimmedQuery || trimmedQuery.length < minQueryLength) {
        setItems([]);
        setIsLoading(false);
        setIsLoadingMore(false);
        setHasMore(false);
        setError(null);
        cursorRef.current = null;
        setIsInitialized(false);
        if (transitionActiveRef.current) {
          transitionActiveRef.current = false;
          signalReady();
        }
        return;
      }

      const cached = cacheRef.current.get(trimmedQuery);
      if (cached) {
        setItems(cached.items);
        setIsLoading(false);
        setIsLoadingMore(false);
        setHasMore(cached.nextCursor !== null);
        setError(null);
        cursorRef.current = cached.nextCursor;
        setIsInitialized(true);
        return;
      }

      setItems([]);
      setIsLoading(true);
      setIsLoadingMore(false);
      setHasMore(false);
      setError(null);
      cursorRef.current = null;

      transitionActiveRef.current = true;
      startTransitionLoading();

      debounceRef.current = setTimeout(() => {
        fetchPage(trimmedQuery, null, false);
      }, debounceMs);
    },
    [debounceMs, fetchPage, minQueryLength, signalReady, startTransitionLoading],
  );

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || !cursorRef.current) {
      return;
    }

    fetchPage(queryRef.current, cursorRef.current, true);
  }, [fetchPage, hasMore, isLoadingMore]);

  const reset = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = undefined;
    }
    abortRef.current?.abort();
    abortRef.current = null;
    setItems([]);
    setIsLoading(false);
    setIsLoadingMore(false);
    setHasMore(false);
    setError(null);
    cursorRef.current = null;
    queryRef.current = "";
    setIsInitialized(false);
  }, []);

  /** 現在のクエリでキャッシュをクリアして再フェッチする */
  const refresh = useCallback(async () => {
    const currentQuery = queryRef.current;
    if (!currentQuery || currentQuery.length < minQueryLength) return;

    // キャッシュを削除して最初から再取得
    cacheRef.current.delete(currentQuery);
    cursorRef.current = null;
    await fetchPage(currentQuery, null, false);
  }, [fetchPage, minQueryLength]);

  return {
    search,
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    isInitialized,
    loadMore,
    reset,
    refresh,
  };
}
