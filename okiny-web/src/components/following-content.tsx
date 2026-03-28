"use client";

import Link from "next/link";

import { RankingCard } from "@/components/ranking-card";
import { useFollowingFeed } from "@/hooks/use-following-feed";
import type { UserProfile } from "@/lib/types";

interface FollowingContentProps {
  onAvatarClick: (author: UserProfile) => void;
  onTagClick: (tagName: string) => void;
}

export function FollowingContent({
  onAvatarClick,
  onTagClick,
}: FollowingContentProps) {
  const {
    rankings,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    retry,
    sentinelRef,
  } = useFollowingFeed({ enabled: true });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

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

  if (rankings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
        <h2 className="text-2xl font-bold text-foreground">
          フォローの公開ランキングはまだありません
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          気になるユーザーをフォローすると、ここに公開ランキングが並びます。
        </p>
        <Link
          href="/search"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-bold text-foreground hover:bg-muted"
        >
          ユーザーを探す
        </Link>
      </div>
    );
  }

  return (
    <div>
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
    </div>
  );
}
