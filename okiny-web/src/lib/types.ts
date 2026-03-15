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
