export const RANKING_ITEM_COUNT = 5;

export type RankingItems = [string, string, string, string, string];

export type ToastType = "success" | "error" | "warning" | "info";

export type AppErrorCode =
  | "NETWORK"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "VALIDATION"
  | "RATE_LIMIT"
  | "SERVER"
  | "NOT_FOUND";

export interface RankingInput {
  title: string;
  tagId: string;
  items: RankingItems;
  isPublic: boolean;
}

export interface DraftLocalRecord extends RankingInput {
  draftId: string;
  userId: string;
  updatedAt: string;
  newTagName?: string;
  selectedTagName?: string;
}

export interface PublishedRanking extends RankingInput {
  id: string;
  userId: string;
  tagName?: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  bookmarkCount: number;
}

export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface PublicRankingWithAuthor extends PublishedRanking {
  author: UserProfile;
}

export interface ToastMessage {
  type: ToastType;
  message: string;
  persistent?: boolean;
}

export interface TagItem {
  id: string;
  name: string;
  readings: string[];
  usageCount: number;
  myUsageCount: number;
  createdAt: string;
}

export interface SupabaseTagRow {
  id: string;
  name: string;
  readings: string[];
  usage_count?: number;
  created_at: string;
}

export interface SupabaseRankingRow {
  id: string;
  user_id: string;
  title: string;
  tag_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  view_count: number;
  bookmark_count: number;
  ranking_items?: Array<{
    rank: number;
    item_text: string;
  }>;
  tags?: { name: string };
}
