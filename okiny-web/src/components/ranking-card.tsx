import type * as React from "react";

import Image from "next/image";
import Link from "next/link";

import { BookmarkButton } from "@/components/bookmark-button";
import { formatSmartDate } from "@/lib/format-date";
import type { PublicRankingWithAuthor } from "@/lib/types";
import { getUserInitial } from "@/lib/user-utils";

function ViewIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ImpressionIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

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

interface AvatarInfo {
  displayName: string;
  avatarUrl: string | null;
  displayUserId: string | null;
}

export interface RankingCardProps {
  ranking: PublicRankingWithAuthor;
  showBorder?: boolean;
  showLockIcon?: boolean;
  showTagBadge?: boolean;
  showBookmark?: boolean;
  onAvatarClick?: (
    event: React.MouseEvent<HTMLButtonElement>,
    author: PublicRankingWithAuthor["author"],
  ) => void;
}

function AvatarImage({
  avatar,
  onAvatarClick,
  author,
}: {
  avatar: AvatarInfo;
  onAvatarClick?: RankingCardProps["onAvatarClick"];
  author: PublicRankingWithAuthor["author"];
}) {
  const initial = getUserInitial(avatar.displayName, "?");

  const image = avatar.avatarUrl ? (
    <Image
      src={avatar.avatarUrl}
      alt={avatar.displayName}
      width={40}
      height={40}
      className="h-10 w-10 rounded-full object-cover"
    />
  ) : (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
      {initial}
    </div>
  );

  if (!onAvatarClick) {
    return <div className="shrink-0">{image}</div>;
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onAvatarClick(event, author);
      }}
      className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`${avatar.displayName}のプロフィール`}
    >
      {image}
    </button>
  );
}

const MAX_VISIBLE_ITEMS = 5;

export function RankingCard({
  ranking,
  showBorder = false,
  showLockIcon = false,
  showTagBadge = false,
  showBookmark = false,
  onAvatarClick,
}: RankingCardProps) {
  const avatar: AvatarInfo = {
    displayName: ranking.author.displayName,
    avatarUrl: ranking.author.avatarUrl,
    displayUserId: ranking.author.displayUserId,
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
        <AvatarImage
          avatar={avatar}
          onAvatarClick={onAvatarClick}
          author={ranking.author}
        />

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-bold text-foreground">
              {avatar.displayName}
            </span>
            {avatar.displayUserId ? (
              <span className="text-xs text-muted-foreground">
                @{avatar.displayUserId}
              </span>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {formatSmartDate(ranking.createdAt)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-[15px] font-semibold text-foreground">
              {ranking.title}
            </h3>
            {showLockIcon && ranking.isPublic === false ? <LockIcon /> : null}
            {showTagBadge && ranking.tagName ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {ranking.tagName}
              </span>
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

          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ViewIcon />
              {ranking.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <ImpressionIcon />
              {ranking.impressionCount}
            </span>
            {showBookmark ? (
              <BookmarkButton
                rankingId={ranking.id}
                initialIsBookmarked={ranking.isBookmarked}
                bookmarkCount={ranking.bookmarkCount}
                compact
                className="-my-1 -ml-1"
              />
            ) : (
              <span className="flex items-center gap-1">
                <BookmarkIcon />
                {ranking.bookmarkCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
