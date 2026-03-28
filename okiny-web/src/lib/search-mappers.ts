import type {
  PublicRankingWithAuthor,
  UserSearchResult,
  SearchCursor,
  UserSearchCursor,
} from "./types";

/** Supabase RPC search_rankings の行 → PublicRankingWithAuthor */
export function mapSearchRankingRow(row: {
  id: string;
  user_id: string;
  title: string;
  tag_id: string;
  tag_name: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  view_count: number;
  impression_count: number;
  bookmark_count: number;
  ranking_items: Array<{ rank: number; item_text: string }> | null;
  author_display_name: string | null;
  author_avatar_url: string | null;
  author_display_user_id: string | null;
  is_bookmarked: boolean;
}): PublicRankingWithAuthor {
  const items = row.ranking_items
    ? [...row.ranking_items].sort((a, b) => a.rank - b.rank)
    : [];

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    tagId: row.tag_id,
    tagName: row.tag_name ?? undefined,
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    viewCount: row.view_count ?? 0,
    impressionCount: row.impression_count ?? 0,
    bookmarkCount: row.bookmark_count ?? 0,
    isBookmarked: row.is_bookmarked ?? false,
    items: [
      items[0]?.item_text ?? "",
      items[1]?.item_text ?? "",
      items[2]?.item_text ?? "",
      items[3]?.item_text ?? "",
      items[4]?.item_text ?? "",
    ] as [string, string, string, string, string],
    author: {
      id: row.user_id,
      displayName: row.author_display_name ?? "",
      avatarUrl: row.author_avatar_url ?? null,
      displayUserId: row.author_display_user_id ?? null,
    },
  };
}

/** Supabase RPC search_users の行 → UserSearchResult */
export function mapSearchUserRow(row: {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  display_user_id: string | null;
  public_ranking_count: number;
}): UserSearchResult {
  return {
    id: row.id,
    displayName: row.display_name ?? "",
    avatarUrl: row.avatar_url ?? null,
    displayUserId: row.display_user_id ?? null,
    publicRankingCount: row.public_ranking_count ?? 0,
  };
}

/** SearchCursor を Base64文字列にエンコード */
export function encodeCursor(cursor: SearchCursor | UserSearchCursor): string {
  return btoa(JSON.stringify(cursor));
}

/** Base64文字列を SearchCursor にデコード */
export function decodeSearchCursor(encoded: string): SearchCursor | null {
  try {
    const parsed = JSON.parse(atob(encoded));
    if (
      parsed &&
      typeof parsed.createdAt === "string" &&
      typeof parsed.id === "string"
    ) {
      return parsed as SearchCursor;
    }
    return null;
  } catch {
    return null;
  }
}

/** Base64文字列を UserSearchCursor にデコード */
export function decodeUserSearchCursor(
  encoded: string,
): UserSearchCursor | null {
  try {
    const parsed = JSON.parse(atob(encoded));
    if (
      parsed &&
      typeof parsed.displayName === "string" &&
      typeof parsed.id === "string"
    ) {
      return parsed as UserSearchCursor;
    }
    return null;
  } catch {
    return null;
  }
}
