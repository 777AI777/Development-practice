"use client";

import Link from "next/link";
import { useEffect } from "react";

import { EmptyStateMessage } from "@/components/empty-state-message";
import { usePageTransition } from "@/components/page-transition-provider";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { RankingCard } from "@/components/ranking-card";
import { useFollowingFeed } from "@/hooks/use-following-feed";
import { useScrollRestore } from "@/hooks/use-scroll-restore";
import { touchFollowingFeedCache } from "@/lib/feed-cache";
import type { UserProfile } from "@/lib/types";

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
    rankings,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    hasFetched,
    retry,
    sentinelRef,
    restoredFromCache,
  } = useFollowingFeed({ enabled });

  useScrollRestore({ key: "scroll:following", enabled: restoredFromCache });

  useEffect(() => {
    if (enabled && restoredFromCache) {
      touchFollowingFeedCache();
    }
  }, [enabled, restoredFromCache]);

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
          onClick={retry}
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
    <PullToRefresh onRefresh={retry}>
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
