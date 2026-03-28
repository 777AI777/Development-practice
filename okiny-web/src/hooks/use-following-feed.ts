"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { FOLLOWING_FEED_LIMIT } from "@/lib/constants";
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
  loadMore: () => void;
  retry: () => void;
  sentinelRef: React.RefCallback<HTMLDivElement>;
}

export function useFollowingFeed({
  enabled,
}: UseFollowingFeedOptions): UseFollowingFeedReturn {
  const [rankings, setRankings] = useState<PublicRankingWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const cursorRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
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

        if (isMore) {
          setRankings((prev) => [...prev, ...json.data.items]);
        } else {
          setRankings(json.data.items);
        }

        cursorRef.current = json.data.nextCursor;
        setHasMore(json.data.nextCursor !== null);
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
        isLoadingRef.current = false;
        abortRef.current = null;

        if (isMore) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!enabled || initializedRef.current) return;

    initializedRef.current = true;
    fetchPage(null, false);
  }, [enabled, fetchPage]);

  const loadMore = useCallback(() => {
    if (isLoadingRef.current || !hasMore || !cursorRef.current) return;

    fetchPage(cursorRef.current, true);
  }, [fetchPage, hasMore]);

  const retry = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    isLoadingRef.current = false;
    initializedRef.current = false;
    cursorRef.current = null;
    setRankings([]);
    setIsLoading(false);
    setIsLoadingMore(false);
    setHasMore(false);
    setError(null);

    fetchPage(null, false);
    initializedRef.current = true;
  }, [fetchPage]);

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
    loadMore,
    retry,
    sentinelRef,
  };
}
