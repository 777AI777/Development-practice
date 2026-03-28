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
  /**
   * キャッシュの名前空間。同じ `useSearch` でも fetcher が異なる場合（rankings / users 等）に
   * キャッシュ衝突を防ぐ。デフォルト: "default"
   */
  namespace?: string;
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
  invalidateCache: (query: string) => void;
  refresh: () => Promise<void>;
}

/**
 * モジュールスコープのインメモリキャッシュ。
 * コンポーネント再マウント（ページ遷移→戻る）でも保持される。
 * タブ/ウィンドウを閉じたら消える（sessionStorageと同等のライフサイクル）。
 *
 * キー形式: `${namespace}:${query}`
 */
const searchCache = new Map<string, { items: unknown[]; nextCursor: string | null }>();

function buildCacheKey(namespace: string, query: string): string {
  return `${namespace}:${query}`;
}

export function invalidateSearchCacheEntry(namespace: string, query: string): void {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return;
  searchCache.delete(buildCacheKey(namespace, trimmedQuery));
}

export function useSearch<TItem>({
  fetcher,
  debounceMs = SEARCH_DEBOUNCE_MS,
  minQueryLength = 1,
  namespace = "default",
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
  /** マウント直後の初回検索かどうか。true=キャッシュ復元、false=フレッシュフェッチ */
  const isMountSearchRef = useRef(true);

  const getCache = useCallback(
    (query: string): { items: TItem[]; nextCursor: string | null } | null => {
      const entry = searchCache.get(buildCacheKey(namespace, query));
      if (!entry) return null;
      return { items: entry.items as TItem[], nextCursor: entry.nextCursor };
    },
    [namespace],
  );

  const putCache = useCallback(
    (query: string, entry: { items: TItem[]; nextCursor: string | null }) => {
      searchCache.set(buildCacheKey(namespace, query), entry);
    },
    [namespace],
  );

  const removeCache = useCallback(
    (query: string) => {
      searchCache.delete(buildCacheKey(namespace, query));
    },
    [namespace],
  );

  const invalidateCache = useCallback(
    (query: string) => {
      invalidateSearchCacheEntry(namespace, query);
    },
    [namespace],
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
          putCache(query, {
            items: mergedItems,
            nextCursor: result.nextCursor,
          });
        } else {
          setItems(result.items);
          putCache(query, {
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
    [fetcher, putCache, signalReady],
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

      if (isMountSearchRef.current) {
        // マウント直後の初回: キャッシュから復元（戻るナビゲーション用）
        isMountSearchRef.current = false;
        const cached = getCache(trimmedQuery);
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
      } else {
        // 2回目以降（能動的検索）: キャッシュを削除してフレッシュフェッチ
        removeCache(trimmedQuery);
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
    [debounceMs, fetchPage, getCache, minQueryLength, removeCache, signalReady, startTransitionLoading],
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
    removeCache(currentQuery);
    cursorRef.current = null;
    await fetchPage(currentQuery, null, false);
  }, [fetchPage, minQueryLength, removeCache]);

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
    invalidateCache,
    refresh,
  };
}
