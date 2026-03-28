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
  impressionCount: number;
  bookmarkCount: number;
  isBookmarked: boolean;
}

export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  displayUserId: string | null;
  introduction: string | null;
}

export interface UserProfileWithCounts extends UserProfile {
  followerCount: number;
  followingCount: number;
}

export interface PublicRankingWithAuthor extends PublishedRanking {
  author: UserProfile;
}

export interface ToastMessage {
  type: ToastType;
  message: string;
  persistent?: boolean;
  action?: { label: string; href: string };
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
  impression_count: number;
  bookmark_count: number;
  ranking_items?: Array<{
    rank: number;
    item_text: string;
  }>;
  tags?: { name: string };
}

// --- Search Types ---

export type SearchTab = "rankings" | "accounts" | "tags";

export interface SearchCursor {
  createdAt: string;
  id: string;
}

export interface UserSearchCursor {
  displayName: string;
  id: string;
}

export interface UserSearchResult {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  displayUserId: string | null;
  publicRankingCount: number;
}

export interface SearchPage<TItem> {
  items: TItem[];
  nextCursor: string | null; // Base64エンコードされたcursor文字列。null=最終ページ
}

export interface SearchHistoryEntry {
  query: string;
  timestamp: number;
}

export interface ViewedUserEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  displayUserId: string | null;
  viewedAt: number;
}
