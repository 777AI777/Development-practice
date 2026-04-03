"use client";

import type * as React from "react";
import Image from "next/image";

import { BookmarkButton } from "@/components/bookmark-button";
import { getUserInitial } from "@/lib/user-utils";
import type {
  UserProfile,
} from "@/lib/types";

export function ViewIcon() {
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

export function ImpressionIcon() {
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

export function BookmarkIcon() {
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

interface RankingCardAvatarProps {
  displayName: string;
  avatarUrl: string | null;
  author: UserProfile;
  onAvatarClick?: (
    event: React.MouseEvent<HTMLButtonElement>,
    author: UserProfile,
  ) => void;
}

export function RankingCardAvatar({
  displayName,
  avatarUrl,
  author,
  onAvatarClick,
}: RankingCardAvatarProps) {
  const initial = getUserInitial(displayName, "?");

  const image = avatarUrl ? (
    <Image
      src={avatarUrl}
      alt={displayName}
      width={40}
      height={40}
      className="h-10 w-10 rounded-full object-cover"
    />
  ) : (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
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
      aria-label={`${displayName}のプロフィール`}
    >
      {image}
    </button>
  );
}

interface RankingCardStatsProps {
  rankingId: string;
  viewCount: number;
  impressionCount: number;
  bookmarkCount: number;
  isBookmarked: boolean;
  showBookmark?: boolean;
  onBookmarkChange?: (nextIsBookmarked: boolean, nextCount: number) => void;
}

export function RankingCardStats({
  rankingId,
  viewCount,
  impressionCount,
  bookmarkCount,
  isBookmarked,
  showBookmark = false,
  onBookmarkChange,
}: RankingCardStatsProps) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span className="flex items-center gap-1">
        <ViewIcon />
        {viewCount}
      </span>
      <span className="flex items-center gap-1">
        <ImpressionIcon />
        {impressionCount}
      </span>
      {showBookmark ? (
        <BookmarkButton
          rankingId={rankingId}
          initialIsBookmarked={isBookmarked}
          bookmarkCount={bookmarkCount}
          compact
          className="-my-1 -ml-1"
          onChange={onBookmarkChange}
        />
      ) : (
        <span className="flex items-center gap-1">
          <BookmarkIcon />
          {bookmarkCount}
        </span>
      )}
    </div>
  );
}

