export const RANKING_ITEM_COUNT = 3;

export type RankingItems = [string, string, string];

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
  borderColor: string;
  markerIcon: string;
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
  comment?: string;
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
  links: ReadonlyArray<{ url: string }> | null;
}

export interface UserProfileWithCounts extends UserProfile {
  followerCount: number;
  followingCount: number;
  publicRankingCount: number;
}

export interface PublicRankingWithAuthor extends PublishedRanking {
  author: UserProfile;
}

export interface PublicRankingWithAuthorAndComment extends PublicRankingWithAuthor {
  latestComment: RankingComment | null;
  cursorId?: string;  // COALESCE(comment_id, ranking_id) - ページネーション用
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
  border_color?: string | null;
  marker_icon?: string | null;
  ranking_items?: Array<{
    rank: number;
    item_text: string;
  }>;
  tags?: { name: string };
}

// --- Search Types ---

export type SearchTab = "posts" | "rankings" | "accounts" | "tags";

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

export interface RecommendCursor {
  priority: number;
  createdAt: string;
  id: string;
}

export interface UserRelationship {
  isFollowing: boolean;
  isMuted: boolean;
  isBlocked: boolean;
  isBlockedBy: boolean;
}

export interface MutedWord {
  id: string;
  word: string;
  createdAt: string;
}

// --- Ranking Comment Types ---

export interface RankingComment {
  id: string;
  rankingId: string;
  userId: string;
  comment: string;
  createdAt: string;
  author?: {
    displayName: string;
    avatarUrl: string | null;
    displayUserId: string | null;
  };
}

export interface SupabaseCommentRow {
  id: string;
  ranking_id: string;
  user_id: string;
  comment: string;
  created_at: string;
}
