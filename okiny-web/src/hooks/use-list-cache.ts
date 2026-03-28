"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import type { ListCacheConfig } from "@/lib/list-cache";
import {
  clearListCache,
  getInvalidationEventName,
  getListCache,
  setListCache,
  touchListCache,
} from "@/lib/list-cache";

export interface PageResult<T> {
  items: T[];
  nextCursor: string | null;
}

interface UseListCacheOptions<T> {
  cache: ListCacheConfig | null;
  fetcher: (cursor: string | null, signal: AbortSignal) => Promise<PageResult<T>>;
  enabled?: boolean;
  scrollRestoreKey?: string | null;
}

interface UseListCacheReturn<T> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  hasFetched: boolean;
  restoredFromCache: boolean;
  sentinelRef: React.RefCallback<HTMLDivElement>;
  refresh: () => Promise<void>;
  loadMore: () => void;
}

export function useListCache<T>({
  cache,
  fetcher,
  enabled = true,
  scrollRestoreKey = null,
}: UseListCacheOptions<T>): UseListCacheReturn<T> {
  const cacheKey = cache?.cacheKey ?? null;
  const ttlMs = cache?.ttlMs;

  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [restoredFromCache, setRestoredFromCache] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const cursorRef = useRef<string | null>(null);
  const itemsRef = useRef<T[]>([]);
  const isLoadingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  const resetState = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    cursorRef.current = null;
    itemsRef.current = [];
    isLoadingRef.current = false;
    hasFetchedRef.current = false;

    setItems([]);
    setHasMore(false);
    setHasFetched(false);
    setRestoredFromCache(false);
    setIsLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
      isLoadingRef.current = false;
      hasFetchedRef.current = false;
    };
  }, []);

  const fetchPage = useCallback(
    async (cursor: string | null, isMore: boolean) => {
      if (isLoadingRef.current) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      isLoadingRef.current = true;

      if (isMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const result = await fetcher(cursor, controller.signal);
        const nextCursor = result.nextCursor;
        const nextHasMore = nextCursor !== null;
        const nextItems = isMore
          ? [...itemsRef.current, ...result.items]
          : result.items;

        itemsRef.current = nextItems;
        cursorRef.current = nextCursor;

        setItems(nextItems);
        setHasMore(nextHasMore);
        setHasFetched(true);

        if (cacheKey) {
          setListCache(
            { cacheKey, ttlMs },
            { items: nextItems, nextCursor, hasMore: nextHasMore },
          );
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "データの読み込みに失敗しました。",
        );

        if (!isMore) {
          setItems([]);
          setHasMore(false);
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          isLoadingRef.current = false;

          if (isMore) {
            setIsLoadingMore(false);
          } else {
            setIsLoading(false);
          }
        }
      }
    },
    [fetcher, cacheKey, ttlMs],
  );

  useEffect(() => {
    if (!enabled) return;

    if (!cacheKey) {
      setRestoredFromCache(false);
      return;
    }

    const freshEntry = getListCache<T>({ cacheKey, ttlMs });
    if (!freshEntry) {
      setRestoredFromCache(false);
      return;
    }

    itemsRef.current = freshEntry.items;
    cursorRef.current = freshEntry.nextCursor;
    hasFetchedRef.current = true;

    setItems(freshEntry.items);
    setHasMore(freshEntry.hasMore);
    setHasFetched(true);
    setIsLoading(false);
    setError(null);
    setRestoredFromCache(true);
  }, [enabled, cacheKey, ttlMs]);

  useEffect(() => {
    if (!enabled) return;
    if (hasFetchedRef.current) return;

    hasFetchedRef.current = true;
    cursorRef.current = null;
    fetchPage(null, false);
  }, [enabled, fetchPage]);

  useEffect(() => {
    if (!enabled || !restoredFromCache || !cacheKey) return;
    touchListCache({ cacheKey, ttlMs });
  }, [enabled, restoredFromCache, cacheKey, ttlMs]);

  useEffect(() => {
    if (!scrollRestoreKey || !restoredFromCache) return;

    const saved = sessionStorage.getItem(scrollRestoreKey);
    if (saved !== null) {
      const scrollY = Number(saved);
      sessionStorage.removeItem(scrollRestoreKey);
      if (Number.isFinite(scrollY)) {
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollY);
        });
      }
    }

    const key = scrollRestoreKey;
    return () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };
  }, [scrollRestoreKey, restoredFromCache]);

  useEffect(() => {
    if (!cacheKey) return;

    const eventName = getInvalidationEventName(cacheKey);
    const handleInvalidated = () => {
      resetState();

      if (enabled) {
        hasFetchedRef.current = true;
        fetchPage(null, false);
      }
    };

    window.addEventListener(eventName, handleInvalidated);
    return () => {
      window.removeEventListener(eventName, handleInvalidated);
    };
  }, [enabled, cacheKey, fetchPage, resetState]);

  const loadMore = useCallback(() => {
    if (isLoadingRef.current || !hasMore || !cursorRef.current) return;
    fetchPage(cursorRef.current, true);
  }, [fetchPage, hasMore]);

  const refresh = useCallback(async () => {
    if (cacheKey) {
      clearListCache({ cacheKey, ttlMs });
      return;
    }

    resetState();
    hasFetchedRef.current = true;
    fetchPage(null, false);
  }, [cacheKey, ttlMs, fetchPage, resetState]);

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    isLoading: isLoadingMore,
    hasMore,
  });

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    hasFetched,
    restoredFromCache,
    sentinelRef,
    refresh,
    loadMore,
  };
}
