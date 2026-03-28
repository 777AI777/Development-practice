"use client";

import Link from "next/link";
import { useEffect } from "react";

import { EmptyStateMessage } from "@/components/empty-state-message";
import { usePageTransition } from "@/components/page-transition-provider";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { RankingCard } from "@/components/ranking-card";
import { useListCache } from "@/hooks/use-list-cache";
import type { PageResult } from "@/hooks/use-list-cache";
import { FOLLOWING_FEED_LIMIT } from "@/lib/constants";
import type { PublicRankingWithAuthor, UserProfile } from "@/lib/types";

async function fetchFollowingFeedPage(
  cursor: string | null,
  signal: AbortSignal,
): Promise<PageResult<PublicRankingWithAuthor>> {
  const params = new URLSearchParams({
    limit: String(FOLLOWING_FEED_LIMIT),
  });
  if (cursor) {
    params.set("cursor", cursor);
  }

  const res = await fetch(`/api/v1/rankings/following?${params}`, {
    signal,
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

  return { items: json.data.items, nextCursor: json.data.nextCursor };
}

interface FollowingContentProps {
  enabled: boolean;
  onAvatarClick: (author: UserProfile) => void;
  onTagClick: (tagName: string) => void;
}

export function FollowingContent({
  enabled,
  onAvatarClick,
  onTagClick,
}: FollowingContentProps) {
  const {
    items: rankings,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    hasFetched,
    refresh,
    sentinelRef,
  } = useListCache<PublicRankingWithAuthor>({
    cache: { cacheKey: "okiny:following-feed-cache" },
    fetcher: fetchFollowingFeedPage,
    enabled,
    scrollRestoreKey: "scroll:following",
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
        title="フォローの公開ランキングはまだありません。"
        description="気になるユーザーをフォローすると、ここに公開ランキングが表示されます。"
      >
        <Link
          href="/search"
          className="text-sm font-medium text-primary transition hover:underline"
        >
          ユーザーを探す
        </Link>
      </EmptyStateMessage>
    );
  }

  return (
    <PullToRefresh onRefresh={refresh}>
      <div className="overflow-hidden rounded-xl bg-card">
        {rankings.map((ranking, index) => (
          <RankingCard
            key={ranking.id}
            ranking={ranking}
            showBorder={index < rankings.length - 1}
            showTagBadge
            showBookmark
            onAvatarClick={(_event, author) => {
              onAvatarClick(author);
            }}
            onTagClick={(_event, tagName) => {
              onTagClick(tagName);
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
