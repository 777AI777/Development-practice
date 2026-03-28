"use client";

import { useEffect } from "react";
import { useSearch } from "@/hooks/use-search";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { RankingCard } from "@/components/ranking-card";
import { SEARCH_LIMIT } from "@/lib/constants";
import type { PublicRankingWithAuthor } from "@/lib/types";

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
  if (cursor) params.set("cursor", cursor);

  const res = await fetch(`/api/v1/search/rankings?${params}`, { signal });
  if (!res.ok) throw new Error("検索に失敗しました");
  const json = await res.json();
  return json.data;
}

export function SearchRankingsTab({ query, isActive }: SearchRankingsTabProps) {
  const {
    search,
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    reset,
  } = useSearch<PublicRankingWithAuthor>({ fetcher: fetchRankings });

  useEffect(() => {
    if (isActive && query) {
      search(query);
    } else {
      reset();
    }
  }, [query, isActive, search, reset]);

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    isLoading: isLoadingMore,
    hasMore,
  });

  if (!isActive) return null;

  if (isLoading) {
    return (
      <p className="py-8 text-center text-xs text-muted-foreground">
        検索中...
      </p>
    );
  }

  if (error) {
    return (
      <div className="mx-4 my-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center">
        <p className="text-xs text-destructive">{error}</p>
        <button
          type="button"
          onClick={() => search(query)}
          className="mt-2 text-xs text-primary hover:underline"
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
          「{query}」に一致する投稿は見つかりませんでした
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
            showBookmark
          />
        ))}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="py-4 text-center">
          {isLoadingMore && (
            <p className="text-xs text-muted-foreground">読み込み中...</p>
          )}
        </div>
      )}
    </div>
  );
}
