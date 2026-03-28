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
   * sessionStorageキャッシュのキープレフィックス。
   * 指定時はクエリごとに `${cacheKey}:${query}` でsessionStorageに保存。
   * nullならインメモリキャッシュ（デフォルト）。
   */
  cacheKey?: string | null;
  /** sessionStorageキャッシュのTTL（ミリ秒）。デフォルト: 30分 */
  cacheTtlMs?: number;
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

const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000; // 30分

interface StoredSearchCache {
  items: unknown[];
  nextCursor: string | null;
  cachedAt: number;
}

function isStoredSearchCache(data: unknown): data is StoredSearchCache {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    Array.isArray(obj.items) &&
    (typeof obj.nextCursor === "string" || obj.nextCursor === null) &&
    typeof obj.cachedAt === "number"
  );
}

function getSessionCache<T>(
  prefix: string,
  query: string,
  ttlMs: number,
): { items: T[]; nextCursor: string | null } | null {
  try {
    const json = sessionStorage.getItem(`${prefix}:${query}`);
    if (!json) return null;
    const parsed: unknown = JSON.parse(json);
    if (!isStoredSearchCache(parsed)) return null;
    if (Date.now() - parsed.cachedAt > ttlMs) {
      sessionStorage.removeItem(`${prefix}:${query}`);
      return null;
    }
    return { items: parsed.items as T[], nextCursor: parsed.nextCursor };
  } catch {
    return null;
  }
}

function setSessionCache<T>(
  prefix: string,
  query: string,
  entry: { items: T[]; nextCursor: string | null },
): void {
  try {
    sessionStorage.setItem(
      `${prefix}:${query}`,
      JSON.stringify({ items: entry.items, nextCursor: entry.nextCursor, cachedAt: Date.now() }),
    );
  } catch {
    // sessionStorage full or blocked
  }
}

function deleteSessionCache(prefix: string, query: string): void {
  try {
    sessionStorage.removeItem(`${prefix}:${query}`);
  } catch {
    // ignore
  }
}

export function useSearch<TItem>({
  fetcher,
  debounceMs = SEARCH_DEBOUNCE_MS,
  minQueryLength = 1,
  cacheKey = null,
  cacheTtlMs = DEFAULT_CACHE_TTL_MS,
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
  const memoryCacheRef = useRef<Map<string, { items: TItem[]; nextCursor: string | null }>>(
    new Map(),
  );

  // キャッシュアクセスをcacheKeyの有無で切り替えるヘルパー
  const getCache = useCallback(
    (query: string): { items: TItem[]; nextCursor: string | null } | null => {
      if (cacheKey) {
        return getSessionCache<TItem>(cacheKey, query, cacheTtlMs);
      }
      return memoryCacheRef.current.get(query) ?? null;
    },
    [cacheKey, cacheTtlMs],
  );

  const putCache = useCallback(
    (query: string, entry: { items: TItem[]; nextCursor: string | null }) => {
      if (cacheKey) {
        setSessionCache(cacheKey, query, entry);
      } else {
        memoryCacheRef.current.set(query, entry);
      }
    },
    [cacheKey],
  );

  const removeCache = useCallback(
    (query: string) => {
      if (cacheKey) {
        deleteSessionCache(cacheKey, query);
      } else {
        memoryCacheRef.current.delete(query);
      }
    },
    [cacheKey],
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
    [debounceMs, fetchPage, getCache, minQueryLength, signalReady, startTransitionLoading],
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
    refresh,
  };
}
