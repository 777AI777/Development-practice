"use client";

import type * as React from "react";
import Link from "next/link";
import { useEffect } from "react";

import { EmptyStateMessage } from "@/components/empty-state-message";
import { usePageTransition } from "@/components/page-transition-provider";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { SmartRankingCard } from "@/components/smart-ranking-card";
import { useListCache } from "@/hooks/use-list-cache";
import type { PageResult } from "@/hooks/use-list-cache";
import {
  RECOMMEND_FEED_CACHE_KEY,
  RECOMMEND_FEED_LIMIT,
  SCROLL_KEY_RECOMMEND,
} from "@/lib/constants";
import type { PublicRankingWithAuthorAndComment, UserProfile } from "@/lib/types";

async function fetchRecommendFeedPage(
  cursor: string | null,
  signal: AbortSignal,
): Promise<PageResult<PublicRankingWithAuthorAndComment>> {
  const params = new URLSearchParams({ limit: String(RECOMMEND_FEED_LIMIT) });
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`/api/v1/rankings/recommend?${params}`, {
    signal,
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: { message?: string } }).error?.message ??
        "おすすめランキングの読み込みに失敗しました。",
    );
  }
  const json = (await res.json()) as {
    data: { items: PublicRankingWithAuthorAndComment[]; nextCursor: string | null };
  };
  return { items: json.data.items, nextCursor: json.data.nextCursor };
}

interface RecommendContentProps {
  enabled: boolean;
  onAvatarClick: (author: UserProfile) => void;
  onTagClick: (tagName: string) => void;
}

export function RecommendContent({
  enabled,
  onAvatarClick,
  onTagClick,
}: RecommendContentProps) {
  const {
    items: rankings,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    hasFetched,
    refresh,
    sentinelRef,
  } = useListCache<PublicRankingWithAuthorAndComment>({
    cache: { cacheKey: RECOMMEND_FEED_CACHE_KEY, ttlMs: 30 * 60 * 1000 },
    fetcher: fetchRecommendFeedPage,
    enabled,
    scrollRestoreKey: SCROLL_KEY_RECOMMEND,
  });

  const { startTransitionLoading, signalReady } = usePageTransition();

  useEffect(() => {
    if (isLoading) {
      startTransitionLoading();
    } else {
      signalReady();
    }
  }, [isLoading, startTransitionLoading, signalReady]);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4">
        <p className="text-base font-bold text-destructive">
          読み込みに失敗しました。
        </p>
        <p className="mt-1 text-sm text-destructive/80">{error}</p>
        <button
          type="button"
          onClick={refresh}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-destructive/30 bg-card px-4 text-sm font-semibold text-destructive"
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (hasFetched && !isLoading && rankings.length === 0) {
    return (
      <EmptyStateMessage
        title="おすすめのランキングはまだありません。"
        description="他のユーザーのランキングを探してみましょう。"
      >
        <Link
          href="/search"
          className="text-sm font-medium text-primary transition hover:underline"
        >
          ランキングを探す
        </Link>
      </EmptyStateMessage>
    );
  }

  return (
    <PullToRefresh onRefresh={refresh}>
      <div className="overflow-hidden rounded-xl bg-card">
        {rankings.map((ranking, index) => {
          const showBorder = index < rankings.length - 1;
          const avatarHandler = (_event: React.MouseEvent<HTMLButtonElement>, author: UserProfile) => {
            onAvatarClick(author);
          };
          const tagHandler = (_event: React.MouseEvent<HTMLButtonElement>, tagName: string) => {
            onTagClick(tagName);
          };

          return (
            <SmartRankingCard
              key={ranking.latestComment?.id ?? ranking.id}
              ranking={ranking}
              showBorder={showBorder}
              showTagBadge
              showBookmark
              onAvatarClick={avatarHandler}
              onTagClick={tagHandler}
            />
          );
        })}
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
