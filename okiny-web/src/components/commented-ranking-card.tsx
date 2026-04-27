"use client";

import type * as React from "react";

import { RankingCard } from "@/components/ranking-card";
import type {
  PublicRankingWithAuthorAndComment,
  UserProfile,
} from "@/lib/types";

// 他ユーザーコメント表示UI（引用リツイート風）は廃止。
// このコンポーネントは import 元を変更せずに済むよう RankingCard のラッパーとして残す。

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

export function CommentedRankingCard({
  ranking,
  showBorder = false,
  showTagBadge = false,
  showBookmark = false,
  onBookmarkChange,
  onAvatarClick,
  onTagClick,
}: CommentedRankingCardProps) {
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
