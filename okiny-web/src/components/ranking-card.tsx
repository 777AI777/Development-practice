"use client";

import type * as React from "react";

import Image from "next/image";
import Link from "next/link";

import {
  RankingCardStats,
} from "@/components/ranking-card-parts";
import {
  getAccentColor,
  getEffectiveBorderColor,
} from "@/components/shared/theme-colors";
import { getMarkerIcon } from "@/components/shared/marker-icons";
import { formatSmartDate } from "@/lib/format-date";
import { getUserInitial } from "@/lib/user-utils";
import type { PublicRankingWithAuthor } from "@/lib/types";

// ---------------------------------------------------------------------------
// LockIcon
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// AvatarDisplay
// ---------------------------------------------------------------------------

interface AvatarDisplayProps {
  displayName: string;
  avatarUrl: string | null;
}

function AvatarDisplay({ displayName, avatarUrl }: AvatarDisplayProps) {
  const initial = getUserInitial(displayName, "?");
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={displayName}
        width={36}
        height={36}
        className="h-9 w-9 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
      {initial}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comment rendering helpers (mirrors figma-make renderCommentWithHashtags)
// ---------------------------------------------------------------------------

function highlightHashtags(text: string) {
  const parts = text.split(/(#[^\s#]+)/g);
  return parts.map((part, i) =>
    part.startsWith("#") ? (
      <span key={i} style={{ color: "var(--primary)" }}>
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function renderCommentWithHashtags(text: string) {
  const lines = text.split("\n");

  // Find where trailing hashtag-only lines begin
  let splitIdx = lines.length;
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed === "") {
      continue;
    }
    if (/^(#[^\s#]+\s*)+$/.test(trimmed)) {
      splitIdx = i;
    } else {
      break;
    }
  }

  const bodyLines = lines.slice(0, splitIdx);
  const tagLines = lines.slice(splitIdx).filter((l) => l.trim() !== "");

  if (tagLines.length === 0) {
    return <>{highlightHashtags(text)}</>;
  }

  const bodyText = bodyLines.join("\n").replace(/\n+$/, "");

  return (
    <>
      {bodyText && (
        <span style={{ whiteSpace: "pre-wrap" }}>{highlightHashtags(bodyText)}</span>
      )}
      <span
        style={{
          display: "block",
          marginTop: "4px",
          whiteSpace: "pre-wrap",
        }}
      >
        {highlightHashtags(tagLines.join("\n"))}
      </span>
    </>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RankingCardProps {
  ranking: PublicRankingWithAuthor;
  showBorder?: boolean;
  showLockIcon?: boolean;
  showTagBadge?: boolean;
  showBookmark?: boolean;
  variant?: "list" | "detail";
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

// ---------------------------------------------------------------------------
// RankingCard
// ---------------------------------------------------------------------------

export function RankingCard({
  ranking,
  showBorder = false,
  showLockIcon = false,
  showTagBadge = false,
  showBookmark = false,
  variant = "list",
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
    links: null,
  };

  const isDetail = variant === "detail";
  const borderColor = ranking.borderColor ?? "#FFE5E5";
  const markerColor = getAccentColor(borderColor);
  const effectiveBorder = getEffectiveBorderColor(borderColor);

  // 有効なアイテムのみ表示（旧5件データ含め全件）
  const validItems = ranking.items.filter((item) => item.trim() !== "");
  const MarkerIcon = getMarkerIcon(ranking.markerIcon ?? "Heart");

  const cardContent = (
    <div
      className="overflow-hidden rounded-2xl shadow-sm transition-[filter]"
      style={{
        backgroundColor: "var(--card)",
        borderWidth: "2px",
        borderStyle: "solid",
        borderColor: effectiveBorder,
      }}
    >
      {/* ヘッダー: アバター + ユーザー名 + @ID + 日時 */}
      <div
        className={`flex items-center gap-3 ${isDetail ? "px-5 py-3.5" : "px-4 py-3"}`}
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {onAvatarClick ? (
          <button
            type="button"
            className="flex items-center gap-3 min-w-0 bg-transparent border-none p-0 cursor-pointer transition hover:opacity-70"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAvatarClick(e, author);
            }}
          >
            <div className="shrink-0">
              <AvatarDisplay displayName={author.displayName} avatarUrl={author.avatarUrl} />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-sm font-semibold truncate text-left text-foreground">
                  {author.displayName}
                </span>
                <span className="text-sm flex-shrink-0 text-left text-muted-foreground">
                  · {formatSmartDate(ranking.updatedAt)}
                </span>
              </div>
              {author.displayUserId && (
                <span className="text-xs truncate text-left text-muted-foreground">
                  @{author.displayUserId}
                </span>
              )}
            </div>
          </button>
        ) : (
          <>
            <div className="shrink-0">
              <AvatarDisplay displayName={author.displayName} avatarUrl={author.avatarUrl} />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-sm font-semibold truncate text-foreground">
                  {author.displayName}
                </span>
                <span className="text-sm flex-shrink-0 text-muted-foreground">
                  · {formatSmartDate(ranking.updatedAt)}
                </span>
                {new Date(ranking.updatedAt).getTime() - new Date(ranking.createdAt).getTime() > 1000 ? (
                  <span className="text-xs text-muted-foreground">編集済み</span>
                ) : null}
              </div>
              {author.displayUserId && (
                <span className="text-xs truncate text-muted-foreground">
                  @{author.displayUserId}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* タイトル */}
      <div className={isDetail ? "px-5 pt-4 pb-2" : "px-4 pt-3 pb-2"}>
        <div className="flex items-center gap-1.5">
          <h3
            className={`${isDetail ? "text-xl" : "text-lg"} font-semibold leading-snug text-foreground`}
          >
            {ranking.title}
          </h3>
          {showLockIcon && ranking.isPublic === false ? <LockIcon /> : null}
        </div>
      </div>

      {/* アイテムリスト */}
      <div className={`flex flex-col gap-1.5 ${isDetail ? "px-5 py-2.5" : "px-4 py-2"}`}>
        {validItems.map((item, i) => (
          <div key={`${ranking.id}-item-${i}`} className="flex items-center gap-2.5">
            <MarkerIcon
              className="shrink-0"
              width={isDetail ? 16 : 14}
              height={isDetail ? 16 : 14}
              style={{ color: markerColor }}
              aria-hidden="true"
            />
            <span
              className={`${isDetail ? "text-base" : "text-sm"} font-semibold leading-relaxed text-foreground`}
              style={{ letterSpacing: "0.05em" }}
            >
              {item}
            </span>
          </div>
        ))}
      </div>

      {/* コメント本文（ranking.comment があれば表示） */}
      {ranking.comment && (
        <div className={isDetail ? "px-5 pb-2" : "px-4 pb-1.5"}>
          <div
            className={`${isDetail ? "text-base" : "text-sm"} leading-relaxed text-foreground text-left`}
          >
            {renderCommentWithHashtags(ranking.comment)}
          </div>
        </div>
      )}

      {/* タグ独立ブロック */}
      {showTagBadge && ranking.tagName ? (
        <div className={isDetail ? "px-5 pb-3" : "px-4 pb-2"}>
          {onTagClick ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTagClick(e, ranking.tagName!);
              }}
              className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition hover:opacity-70"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--primary)",
              }}
            >
              #{ranking.tagName}
            </button>
          ) : (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--primary)",
              }}
            >
              #{ranking.tagName}
            </span>
          )}
        </div>
      ) : null}

      {/* フッター: 統計（左）+ ActionButtons（右） */}
      <div className={`flex items-center justify-between ${isDetail ? "px-5 pb-4 pt-1" : "px-4 pb-3 pt-1"}`}>
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
  );

  // listバリアントはLinkでラップ、detailはそのまま
  if (variant === "list") {
    return (
      <Link
        href={`/rankings/${ranking.id}`}
        className="block transition hover:brightness-95"
        style={{
          borderBottom: showBorder ? "1px solid var(--border)" : "none",
        }}
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
