"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { FOLLOWING_FEED_LIMIT } from "@/lib/constants";
import {
  FOLLOWING_FEED_INVALIDATED_EVENT,
  clearFollowingFeedCache,
  getFollowingFeedCache,
  setFollowingFeedCache,
} from "@/lib/feed-cache";
import type { PublicRankingWithAuthor } from "@/lib/types";

interface UseFollowingFeedOptions {
  enabled: boolean;
}

interface UseFollowingFeedReturn {
  rankings: PublicRankingWithAuthor[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  hasFetched: boolean;
  loadMore: () => void;
  retry: () => Promise<void>;
  sentinelRef: React.RefCallback<HTMLDivElement>;
  restoredFromCache: boolean;
}

export function useFollowingFeed({
  enabled,
}: UseFollowingFeedOptions): UseFollowingFeedReturn {
  const cachedEntry = getFollowingFeedCache();

  const [rankings, setRankings] = useState<PublicRankingWithAuthor[]>(
    () => cachedEntry?.rankings ?? [],
  );
  const [isLoading, setIsLoading] = useState(!cachedEntry && enabled);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(() => cachedEntry?.hasMore ?? false);
  const [error, setError] = useState<string | null>(null);
  const [restoredFromCache] = useState(() => cachedEntry !== null);
  const [hasFetched, setHasFetched] = useState(() => cachedEntry !== null);

  const abortRef = useRef<AbortController | null>(null);
  const cursorRef = useRef<string | null>(cachedEntry?.nextCursor ?? null);
  const rankingsRef = useRef<PublicRankingWithAuthor[]>(cachedEntry?.rankings ?? []);
  const isLoadingRef = useRef(false);
  const hasFetchedRef = useRef(cachedEntry !== null);

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
        const params = new URLSearchParams({
          limit: String(FOLLOWING_FEED_LIMIT),
        });
        if (cursor) {
          params.set("cursor", cursor);
        }

        const res = await fetch(`/api/v1/rankings/following?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { error?: { message?: string } }).error?.message ??
              "フォローランキングの読み込みに失敗しました。",
          );
        }

        const json = (await res.json()) as {
          data: {
            items: PublicRankingWithAuthor[];
            nextCursor: string | null;
          };
        };

        const nextCursor = json.data.nextCursor;
        const nextHasMore = nextCursor !== null;

        if (isMore) {
          const merged = [...rankingsRef.current, ...json.data.items];
          rankingsRef.current = merged;
          setRankings(merged);
          setFollowingFeedCache({
            rankings: merged,
            nextCursor,
            hasMore: nextHasMore,
          });
        } else {
          rankingsRef.current = json.data.items;
          setRankings(json.data.items);
          setFollowingFeedCache({
            rankings: json.data.items,
            nextCursor,
            hasMore: nextHasMore,
          });
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
            : "フォローランキングの読み込みに失敗しました。",
        );

        if (!isMore) {
          setRankings([]);
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
    [],
  );

  // 初回フェッチ: enabled が true になった時点で1回だけ実行
  // fetchPage を依存から外し、enabled の変化のみでトリガーする
  useEffect(() => {
    if (!enabled) return;
    if (hasFetchedRef.current) return;

    hasFetchedRef.current = true;
    cursorRef.current = null;
    fetchPage(null, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // キャッシュ無効化検知: clearFollowingFeedCache() が呼ばれたら再フェッチ
  // フォロー解除 → clearFollowingFeedCache → CustomEvent dispatch → ここで検知
  useEffect(() => {
    if (!enabled) return;

    const handleInvalidated = () => {
      // 進行中のフェッチをキャンセル
      abortRef.current?.abort();
      abortRef.current = null;
      isLoadingRef.current = false;
      hasFetchedRef.current = false;
      cursorRef.current = null;
      rankingsRef.current = [];
      setRankings([]);
      setHasMore(false);
      setHasFetched(false);
      setError(null);

      // 再フェッチ
      hasFetchedRef.current = true;
      fetchPage(null, false);
    };

    window.addEventListener(
      FOLLOWING_FEED_INVALIDATED_EVENT,
      handleInvalidated,
    );
    return () => {
      window.removeEventListener(
        FOLLOWING_FEED_INVALIDATED_EVENT,
        handleInvalidated,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const loadMore = useCallback(() => {
    if (isLoadingRef.current || !hasMore || !cursorRef.current) return;

    fetchPage(cursorRef.current, true);
  }, [fetchPage, hasMore]);

  const retry = useCallback(async () => {
    // clearFollowingFeedCache が CustomEvent を dispatch し、
    // handleInvalidated でリセット + 再フェッチが実行される
    clearFollowingFeedCache();
  }, []);

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    isLoading: isLoadingMore,
    hasMore,
  });

  return {
    rankings,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    hasFetched,
    loadMore,
    retry,
    sentinelRef,
    restoredFromCache,
  };
}
