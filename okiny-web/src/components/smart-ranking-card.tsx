"use client";

import type * as React from "react";

import { CommentedRankingCard } from "@/components/commented-ranking-card";
import { RankingCard } from "@/components/ranking-card";
import type { PublicRankingWithAuthorAndComment } from "@/lib/types";

interface SmartRankingCardProps {
  ranking: PublicRankingWithAuthorAndComment;
  showBorder?: boolean;
  showTagBadge?: boolean;
  showBookmark?: boolean;
  onBookmarkChange?: (nextIsBookmarked: boolean, nextCount: number) => void;
  onAvatarClick?: (
    event: React.MouseEvent<HTMLButtonElement>,
    author: PublicRankingWithAuthorAndComment["author"],
  ) => void;
  onTagClick?: (
    event: React.MouseEvent<HTMLButtonElement>,
    tagName: string,
  ) => void;
}

export function SmartRankingCard({
  ranking,
  ...props
}: SmartRankingCardProps) {
  if (ranking.latestComment) {
    return <CommentedRankingCard ranking={ranking} {...props} />;
  }
  return <RankingCard ranking={ranking} {...props} />;
}
