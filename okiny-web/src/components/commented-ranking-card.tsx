"use client";

import type * as React from "react";
import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { RankingCard } from "@/components/ranking-card";
import {
  RankingCardAvatar,
  RankingCardStats,
} from "@/components/ranking-card-parts";
import { useToast } from "@/components/toast-provider";
import { useSessionUser } from "@/hooks/use-session-user";
import { formatSmartDate } from "@/lib/format-date";
import type {
  PublicRankingWithAuthorAndComment,
  UserProfile,
} from "@/lib/types";
import { getUserInitial } from "@/lib/user-utils";

export interface CommentedRankingCardProps {
  ranking: PublicRankingWithAuthorAndComment;
  showBorder?: boolean;
  showTagBadge?: boolean;
  showBookmark?: boolean;
  onBookmarkChange?: (nextIsBookmarked: boolean, nextCount: number) => void;
  onAvatarClick?: (
    event: React.MouseEvent<HTMLButtonElement>,
    author: UserProfile,
  ) => void;
  onTagClick?: (
    event: React.MouseEvent<HTMLButtonElement>,
    tagName: string,
  ) => void;
}

const MAX_VISIBLE_ITEMS = 5;

export function CommentedRankingCard({
  ranking,
  showBorder = false,
  showTagBadge = false,
  showBookmark = false,
  onBookmarkChange,
  onAvatarClick,
  onTagClick,
}: CommentedRankingCardProps) {
  const { latestComment } = ranking;
  const { user } = useSessionUser();
  const { pushToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // コメントがない、または削除済みの場合は通常のRankingCardにフォールバック
  if (!latestComment || isDeleted) {
    return (
      <RankingCard
        ranking={ranking}
        showBorder={showBorder}
        showTagBadge={showTagBadge}
        showBookmark={showBookmark}
        onBookmarkChange={onBookmarkChange}
        onAvatarClick={onAvatarClick}
        onTagClick={onTagClick}
      />
    );
  }

  const isOwnComment = user !== null && latestComment.userId === user.id;

  const handleDeleteComment = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/v1/rankings/${ranking.id}/comment?commentId=${latestComment.id}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setIsDeleted(true);
      } else {
        pushToast({
          type: "error",
          message: "コメントの削除に失敗しました",
        });
      }
    } catch {
      pushToast({
        type: "error",
        message: "コメントの削除に失敗しました",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const rankingAuthor: UserProfile = ranking.author ?? {
    id: ranking.userId,
    displayName: "ユーザー",
    avatarUrl: null,
    displayUserId: null,
    introduction: null,
    links: null,
  };

  // コメント投稿者情報（latestComment.author がある場合は引用リツイート風）
  const hasCommentAuthor = latestComment.author != null;

  const headerProfile: UserProfile = hasCommentAuthor
    ? {
        id: latestComment.userId,
        displayName: latestComment.author!.displayName,
        avatarUrl: latestComment.author!.avatarUrl,
        displayUserId: latestComment.author!.displayUserId,
        introduction: null,
        links: null,
      }
    : rankingAuthor;

  return (
    <Link
      href={`/rankings/${ranking.id}`}
      className="block transition hover:bg-muted/50"
      style={{
        borderBottom: showBorder ? "1px solid var(--border)" : "none",
      }}
    >
      <div className="flex items-start gap-3 p-4">
        <RankingCardAvatar
          displayName={headerProfile.displayName}
          avatarUrl={headerProfile.avatarUrl}
          author={headerProfile}
          onAvatarClick={onAvatarClick}
        />

        <div className="min-w-0 flex-1 space-y-2">
          {/* ヘッダー: コメント投稿者（or 後方互換でランキング著者） */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-base font-bold text-foreground">
              {headerProfile.displayName}
            </span>
            {headerProfile.displayUserId ? (
              <span className="text-sm text-muted-foreground">
                @{headerProfile.displayUserId}
              </span>
            ) : null}
            <span className="text-sm text-muted-foreground">
              {formatSmartDate(latestComment.createdAt)}
            </span>
          </div>

          {/* コメント本文 + 削除ボタン */}
          <div className="flex items-start gap-1">
            <p className="min-w-0 flex-1 text-base text-foreground">
              {latestComment.comment}
            </p>
            {isOwnComment ? (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteComment}
                className="shrink-0 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label="コメントを削除"
              >
                {isDeleting ? (
                  <svg
                    className="size-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </button>
            ) : null}
          </div>

          {/* ランキング引用ボックス */}
          <div className="rounded-xl border border-border p-3 space-y-1">
            {/* 引用ボックス内: ランキング著者 */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAvatarClick?.(e, rankingAuthor);
              }}
              className="flex items-center gap-1.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`${rankingAuthor.displayName}のプロフィール`}
            >
              <QuoteAuthorAvatar
                displayName={rankingAuthor.displayName}
                avatarUrl={rankingAuthor.avatarUrl}
              />
              <span className="text-sm font-bold text-foreground">
                {rankingAuthor.displayName}
              </span>
              {rankingAuthor.displayUserId ? (
                <span className="text-xs text-muted-foreground">
                  @{rankingAuthor.displayUserId}
                </span>
              ) : null}
            </button>

            <p className="text-[15px] font-semibold text-foreground">
              {ranking.title}
            </p>
            {showTagBadge && ranking.tagName ? (
              onTagClick ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onTagClick(e, ranking.tagName!);
                  }}
                  className="text-sm text-primary transition hover:text-primary/70"
                >
                  #{ranking.tagName}
                </button>
              ) : (
                <span className="text-sm text-primary">
                  #{ranking.tagName}
                </span>
              )
            ) : null}
            <div className="space-y-0.5">
              {ranking.items.slice(0, MAX_VISIBLE_ITEMS).map((item, index) => (
                <p
                  key={`${ranking.id}-item-${index}`}
                  className="text-sm leading-relaxed text-muted-foreground"
                >
                  {index + 1}. {item || "未入力"}
                </p>
              ))}
            </div>
          </div>

          {/* 統計 */}
          <RankingCardStats
            rankingId={ranking.id}
            viewCount={ranking.viewCount}
            impressionCount={ranking.impressionCount}
            bookmarkCount={ranking.bookmarkCount}
            isBookmarked={ranking.isBookmarked}
            showBookmark={showBookmark}
            onBookmarkChange={onBookmarkChange}
          />
        </div>
      </div>
    </Link>
  );
}

/** 引用ボックス内のランキング著者アバター（小サイズ） */
function QuoteAuthorAvatar({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl: string | null;
}) {
  const initial = getUserInitial(displayName, "?");

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={displayName}
        width={20}
        height={20}
        className="h-5 w-5 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
      {initial}
    </div>
  );
}
