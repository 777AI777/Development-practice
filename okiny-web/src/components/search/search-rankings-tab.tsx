"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { RankingCard } from "@/components/ranking-card";
import { usePageTransition } from "@/components/page-transition-provider";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useSearch } from "@/hooks/use-search";
import { SEARCH_LIMIT } from "@/lib/constants";
import type { PublicRankingWithAuthor } from "@/lib/types";
import { buildUserProfilePath } from "@/lib/user-utils";

interface SearchRankingsTabProps {
  query: string;
  isActive: boolean;
}

async function fetchRankings(
  query: string,
  cursor: string | null,
  signal: AbortSignal,
): Promise<{ items: PublicRankingWithAuthor[]; nextCursor: string | null }> {
  const params = new URLSearchParams({ q: query, limit: String(SEARCH_LIMIT) });
  if (cursor) {
    params.set("cursor", cursor);
  }

  const res = await fetch(`/api/v1/search/rankings?${params}`, { signal });
  if (!res.ok) {
    throw new Error("Failed to search rankings");
  }

  const json = await res.json();
  return json.data;
}

export function SearchRankingsTab({
  query,
  isActive,
}: SearchRankingsTabProps) {
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
  } = useSearch<PublicRankingWithAuthor>({ fetcher: fetchRankings });
  const normalizedQuery = query.trim();
  const { signalReady } = usePageTransition();

  useEffect(() => {
    if (!normalizedQuery) {
      reset();
      return;
    }

    if (isActive) {
      search(normalizedQuery);
    }
  }, [isActive, normalizedQuery, reset, search]);

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
    <div>
      <div className="overflow-hidden rounded-xl bg-card">
        {items.map((ranking, idx) => (
          <RankingCard
            key={ranking.id}
            ranking={ranking}
            showBorder={idx < items.length - 1}
            showTagBadge
            showBookmark
            onAvatarClick={(_event, author) => {
              router.push(buildUserProfilePath(author));
            }}
            onTagClick={(_event, tagName) => {
              router.push(`/search?q=${encodeURIComponent('#' + tagName)}&tab=rankings`);
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
    </div>
  );
}
