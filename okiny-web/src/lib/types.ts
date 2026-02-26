export const RANKING_ITEM_COUNT = 5;

export type RankingItems = [string, string, string, string, string];

export type ToastType = "success" | "error" | "warning" | "info";

export type AppErrorCode =
  | "NETWORK"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION"
  | "RATE_LIMIT"
  | "SERVER"
  | "NOT_FOUND";

export interface RankingInput {
  title: string;
  tagId: string;
  items: RankingItems;
}

export interface DraftLocalRecord extends RankingInput {
  draftId: string;
  userId: string;
  updatedAt: string;
}

export interface PublishedRanking extends RankingInput {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RankingRecordWithDraft extends RankingInput {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  source: "published" | "draft";
  draftId?: string;
}

export interface ApiError {
  code: AppErrorCode;
  message: string;
}

export interface ToastMessage {
  type: ToastType;
  message: string;
  persistent?: boolean;
}

export interface SupabaseRankingRow {
  id: string;
  user_id: string;
  title: string;
  tag_id: string;
  created_at: string;
  updated_at: string;
  ranking_items?: Array<{
    rank: number;
    item_text: string;
  }>;
}

export type Visibility = "private" | "followers" | "public";

export interface UserMini {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface UserProfile extends UserMini {
  bio?: string;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
}

export interface CommentSummary {
  id: string;
  user: UserMini;
  body: string;
  createdAt: string;
}

export interface Reaction {
  type: "like" | "save";
  count: number;
  reactedByMe: boolean;
}

export interface FeedItem {
  id: string;
  rankingId: string;
  title: string;
  tagId: string;
  previewItems: string[];
  author: UserMini;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
  reactions: Reaction[];
  commentsCount: number;
}
