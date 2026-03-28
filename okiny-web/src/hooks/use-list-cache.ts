"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import type { ListCacheConfig, ListCacheEntry } from "@/lib/list-cache";
import {
  clearListCache,
  getInvalidationEventName,
  getListCache,
  setListCache,
  touchListCache,
} from "@/lib/list-cache";

/** ページ取得結果 */
export interface PageResult<T> {
  items: T[];
  nextCursor: string | null;
}

interface UseListCacheOptions<T> {
  /** sessionStorageキャッシュ設定。nullならキャッシュ無効 */
  cache: ListCacheConfig | null;
  /** データ取得関数 */
  fetcher: (cursor: string | null, signal: AbortSignal) => Promise<PageResult<T>>;
  /** フックの有効/無効（タブ切替等） */
  enabled?: boolean;
  /** スクロール復元キー。nullなら復元しない */
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
  // --- キャッシュ初期化 ---
  const cachedEntry = cache ? getListCache<T>(cache) : null;

  const [items, setItems] = useState<T[]>(() => cachedEntry?.items ?? []);
  const [isLoading, setIsLoading] = useState(!cachedEntry && enabled);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(() => cachedEntry?.hasMore ?? false);
  const [error, setError] = useState<string | null>(null);
  const [restoredFromCache] = useState(() => cachedEntry !== null);
  const [hasFetched, setHasFetched] = useState(() => cachedEntry !== null);

  const abortRef = useRef<AbortController | null>(null);
  const cursorRef = useRef<string | null>(cachedEntry?.nextCursor ?? null);
  const itemsRef = useRef<T[]>(cachedEntry?.items ?? []);
  const isLoadingRef = useRef(false);
  const hasFetchedRef = useRef(cachedEntry !== null);

  // --- Strict Mode 対策: cleanup で全ref リセット ---
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
      isLoadingRef.current = false;
      hasFetchedRef.current = false;
    };
  }, []);

  // --- フェッチ処理 ---
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

        if (isMore) {
          const merged = [...itemsRef.current, ...result.items];
          itemsRef.current = merged;
          setItems(merged);
          if (cache) {
            setListCache(cache, {
              items: merged,
              nextCursor,
              hasMore: nextHasMore,
            });
          }
        } else {
          itemsRef.current = result.items;
          setItems(result.items);
          if (cache) {
            setListCache(cache, {
              items: result.items,
              nextCursor,
              hasMore: nextHasMore,
            });
          }
        }

        cursorRef.current = nextCursor;
        setHasMore(nextHasMore);
        setHasFetched(true);
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
          isLoadingRef.current = false;
          abortRef.current = null;

          if (isMore) {
            setIsLoadingMore(false);
          } else {
            setIsLoading(false);
          }
        }
      }
    },
    // fetcher と cache はオプションとして渡され、呼び出し側で安定化される前提
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // --- 初回フェッチ: enabled && 未フェッチ && キャッシュ復元なし ---
  useEffect(() => {
    if (!enabled) return;
    if (hasFetchedRef.current) return;

    hasFetchedRef.current = true;
    cursorRef.current = null;
    fetchPage(null, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // --- TTLリフレッシュ: キャッシュ復元時にタイムスタンプをリセット ---
  useEffect(() => {
    if (!enabled || !restoredFromCache || !cache) return;
    touchListCache(cache);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, restoredFromCache]);

  // --- スクロール復元 ---
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollRestoreKey, restoredFromCache]);

  // --- キャッシュ無効化検知: 外部から clearListCache が呼ばれたとき ---
  useEffect(() => {
    if (!cache) return;

    const eventName = getInvalidationEventName(cache.cacheKey);

    const handleInvalidated = () => {
      // 進行中のフェッチをキャンセル
      abortRef.current?.abort();
      abortRef.current = null;
      isLoadingRef.current = false;
      hasFetchedRef.current = false;
      cursorRef.current = null;
      itemsRef.current = [];
      setItems([]);
      setHasMore(false);
      setHasFetched(false);
      setError(null);

      // enabled なら再フェッチ
      if (enabled) {
        hasFetchedRef.current = true;
        fetchPage(null, false);
      }
    };

    window.addEventListener(eventName, handleInvalidated);
    return () => {
      window.removeEventListener(eventName, handleInvalidated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, cache?.cacheKey]);

  // --- enabled切替: false → true でキャッシュから再読み込み ---
  const prevEnabledRef = useRef(enabled);
  useEffect(() => {
    const wasDisabled = !prevEnabledRef.current;
    prevEnabledRef.current = enabled;

    if (!wasDisabled || !enabled || !cache) return;

    // タブ切替で enabled が true に戻ったとき、sessionStorage から最新キャッシュを同期
    const freshEntry = getListCache<T>(cache);
    if (freshEntry) {
      itemsRef.current = freshEntry.items;
      setItems(freshEntry.items);
      cursorRef.current = freshEntry.nextCursor;
      setHasMore(freshEntry.hasMore);
      setHasFetched(true);
      hasFetchedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // --- loadMore ---
  const loadMore = useCallback(() => {
    if (isLoadingRef.current || !hasMore || !cursorRef.current) return;

    fetchPage(cursorRef.current, true);
  }, [fetchPage, hasMore]);

  // --- refresh ---
  const refresh = useCallback(async () => {
    if (cache) {
      // clearListCache が CustomEvent を dispatch し、
      // handleInvalidated でリセット + 再フェッチが実行される
      clearListCache(cache);
    } else {
      // キャッシュ無効の場合は直接リセット + 再フェッチ
      abortRef.current?.abort();
      abortRef.current = null;
      isLoadingRef.current = false;
      hasFetchedRef.current = false;
      cursorRef.current = null;
      itemsRef.current = [];
      setItems([]);
      setHasMore(false);
      setHasFetched(false);
      setError(null);

      hasFetchedRef.current = true;
      fetchPage(null, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage, cache?.cacheKey]);

  // --- 無限スクロール統合 ---
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
