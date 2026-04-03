import type * as React from "react";

import Link from "next/link";

import {
  RankingCardAvatar,
  RankingCardStats,
} from "@/components/ranking-card-parts";
import { formatSmartDate } from "@/lib/format-date";
import type { PublicRankingWithAuthor } from "@/lib/types";

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
      aria-label="非公開"
    >
      <path
        fillRule="evenodd"
        d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export interface RankingCardProps {
  ranking: PublicRankingWithAuthor;
  showBorder?: boolean;
  showLockIcon?: boolean;
  showTagBadge?: boolean;
  showBookmark?: boolean;
  onBookmarkChange?: (nextIsBookmarked: boolean, nextCount: number) => void;
  onAvatarClick?: (
    event: React.MouseEvent<HTMLButtonElement>,
    author: PublicRankingWithAuthor["author"],
  ) => void;
  onTagClick?: (
    event: React.MouseEvent<HTMLButtonElement>,
    tagName: string,
  ) => void;
}

const MAX_VISIBLE_ITEMS = 5;

export function RankingCard({
  ranking,
  showBorder = false,
  showLockIcon = false,
  showTagBadge = false,
  showBookmark = false,
  onBookmarkChange,
  onAvatarClick,
  onTagClick,
}: RankingCardProps) {
  const author = ranking.author ?? {
    id: ranking.userId,
    displayName: "ユーザー",
    avatarUrl: null,
    displayUserId: null,
    introduction: null,
  };

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
          displayName={author.displayName}
          avatarUrl={author.avatarUrl}
          author={author}
          onAvatarClick={onAvatarClick}
        />

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-bold text-foreground">
              {author.displayName}
            </span>
            {author.displayUserId ? (
              <span className="text-xs text-muted-foreground">
                @{author.displayUserId}
              </span>
            ) : null}
            <span className="text-sm text-muted-foreground">
              {formatSmartDate(ranking.updatedAt)}
            </span>
            {new Date(ranking.updatedAt).getTime() - new Date(ranking.createdAt).getTime() > 1000 ? (
              <span className="text-xs text-muted-foreground">編集済み</span>
            ) : null}
          </div>

          <div className="flex flex-col items-start gap-0.5">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[15px] font-semibold text-foreground">
                {ranking.title}
              </h3>
              {showLockIcon && ranking.isPublic === false ? <LockIcon /> : null}
            </div>
            {showTagBadge && ranking.tagName ? (
              onTagClick ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onTagClick(e, ranking.tagName!);
                  }}
                  className="text-xs text-primary transition hover:text-primary/70"
                >
                  #{ranking.tagName}
                </button>
              ) : (
                <span className="text-xs text-primary">
                  #{ranking.tagName}
                </span>
              )
            ) : null}
          </div>

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

          <div className="mt-1.5">
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
      </div>
    </Link>
  );
}
