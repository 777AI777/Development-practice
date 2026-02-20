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

export interface ApiError {
  code: AppErrorCode;
  message: string;
}

export interface ToastMessage {
  type: ToastType;
  message: string;
  persistent?: boolean;
}

