"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { SmartRankingCard } from "@/components/smart-ranking-card";
import { usePageTransition } from "@/components/page-transition-provider";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useSearch } from "@/hooks/use-search";
import {
  SEARCH_SUBMIT_EVENT_NAME,
  SEARCH_LIMIT,
  SEARCH_POSTS_SCROLL_KEY,
} from "@/lib/constants";
import type { PublicRankingWithAuthorAndComment } from "@/lib/types";
import { buildUserProfilePath } from "@/lib/user-utils";

interface SearchPostsTabProps {
  query: string;
  isActive: boolean;
}

async function fetchPosts(
  query: string,
  cursor: string | null,
  signal: AbortSignal,
): Promise<{ items: PublicRankingWithAuthorAndComment[]; nextCursor: string | null }> {
  const params = new URLSearchParams({ q: query, limit: String(SEARCH_LIMIT) });
  if (cursor) {
    params.set("cursor", cursor);
  }

  const res = await fetch(`/api/v1/search/posts?${params}`, { signal });
  if (!res.ok) {
    throw new Error("Failed to search posts");
  }

  const json = await res.json();
  return json.data;
}

export function SearchPostsTab({
  query,
  isActive,
}: SearchPostsTabProps) {
  const router = useRouter();
  const {
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
    invalidateCache,
  } = useSearch<PublicRankingWithAuthorAndComment>({
    fetcher: fetchPosts,
    namespace: "posts",
  });
  const normalizedQuery = query.trim();
  const { signalReady } = usePageTransition();

  // --- タブ切替で search() が再発火しないよう ref で管理 ---
  const isActiveRef = useRef(isActive);
  const pendingQueryRef = useRef<string | null>(null);
  const lastRequestedQueryRef = useRef("");

  useEffect(() => {
    isActiveRef.current = isActive;

    // タブがアクティブになったとき、保留中のクエリがあれば実行
    if (isActive && pendingQueryRef.current !== null) {
      const pending = pendingQueryRef.current;
      pendingQueryRef.current = null;
      search(pending);
    }
  }, [isActive, search]);

  const searchIfActive = useCallback(
    (q: string) => {
      if (isActiveRef.current) {
        search(q);
      } else {
        pendingQueryRef.current = q;
      }
    },
    [search],
  );

  useEffect(() => {
    if (!normalizedQuery) {
      reset();
      pendingQueryRef.current = null;
      lastRequestedQueryRef.current = "";
      return;
    }

    if (lastRequestedQueryRef.current === normalizedQuery) {
      return;
    }

    lastRequestedQueryRef.current = normalizedQuery;
    searchIfActive(normalizedQuery);

    return () => {
      lastRequestedQueryRef.current = "";
    };
  }, [normalizedQuery, reset, searchIfActive]);

  useEffect(() => {
    const handleSearchSubmit = (event: Event) => {
      const submittedQuery =
        (
          event as CustomEvent<{ query?: string }>
        ).detail?.query?.trim() ?? "";

      if (!submittedQuery || submittedQuery !== normalizedQuery) {
        return;
      }

      lastRequestedQueryRef.current = "";
      reset();
      invalidateCache(submittedQuery);
      searchIfActive(submittedQuery);
    };

    window.addEventListener(SEARCH_SUBMIT_EVENT_NAME, handleSearchSubmit);
    return () => {
      window.removeEventListener(SEARCH_SUBMIT_EVENT_NAME, handleSearchSubmit);
    };
  }, [invalidateCache, normalizedQuery, reset, searchIfActive]);

  useEffect(() => {
    if (!isActive) return;

    if (!normalizedQuery) {
      signalReady();
      return;
    }

    if (isInitialized && !isLoading) {
      signalReady();
    }
  }, [isActive, normalizedQuery, isInitialized, isLoading, signalReady]);

  // --- スクロール復元 ---
  const scrollRestoredRef = useRef(false);

  // scrollイベントで常時保存（throttle 200ms）
  useEffect(() => {
    if (!isActive || items.length === 0) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        sessionStorage.setItem(SEARCH_POSTS_SCROLL_KEY, String(window.scrollY));
        timeoutId = null;
      }, 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
      scrollRestoredRef.current = false;
    };
  }, [isActive, items.length]);

  // データ復元後にスクロール位置を復元
  useLayoutEffect(() => {
    if (!isActive || !isInitialized || isLoading || items.length === 0) return;
    if (scrollRestoredRef.current) return;

    scrollRestoredRef.current = true;
    const saved = sessionStorage.getItem(SEARCH_POSTS_SCROLL_KEY);
    if (saved !== null) {
      const scrollY = Number(saved);
      if (Number.isFinite(scrollY)) {
        window.scrollTo(0, scrollY);
      }
    }
  }, [isActive, isInitialized, isLoading, items.length]);

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    isLoading: isLoadingMore,
    hasMore,
  });

  if (!isActive) {
    return null;
  }

  if (isLoading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        検索中...
      </p>
    );
  }

  if (error) {
    return (
      <div className="mx-4 my-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <button
          type="button"
          onClick={() => search(normalizedQuery)}
          className="mt-2 text-sm text-primary hover:underline"
        >
          再試行
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          「{normalizedQuery}」に一致する投稿は見つかりませんでした
        </p>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={refresh}>
      <div className="overflow-hidden rounded-xl bg-card">
        {items.map((ranking, idx) => (
          <SmartRankingCard
            key={ranking.id}
            ranking={ranking}
            showBorder={idx < items.length - 1}
            showTagBadge
            showBookmark
            onAvatarClick={(_event, author) => {
              router.push(buildUserProfilePath(author));
            }}
            onTagClick={(_event, tagName) => {
              router.push(`/search?q=${encodeURIComponent('#' + tagName)}&tab=posts`);
            }}
          />
        ))}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="py-4 text-center">
          {isLoadingMore && (
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          )}
        </div>
      )}
    </PullToRefresh>
  );
}
