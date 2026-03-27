/**
 * Public profile and shared-ranking helpers that read from Supabase with the
 * service role key so they can bypass RLS safely on the server.
 */

import { isUuid, toUserProfileLookup } from "@/lib/user-utils";

interface PublicRankingData {
  readonly title: string;
  readonly tagName: string;
  readonly items: readonly string[];
  readonly authorId: string;
  readonly authorName: string;
  readonly authorAvatarUrl: string | null;
  readonly authorDisplayUserId: string | null;
}

interface SupabasePublicRankingRow {
  readonly id: string;
  readonly user_id: string;
  readonly title: string;
  readonly tag_id: string;
  readonly is_public: boolean;
  readonly ranking_items?: ReadonlyArray<{
    readonly rank: number;
    readonly item_text: string;
  }>;
  readonly tags?: { readonly name: string };
}

interface SupabaseUserProfileRow {
  readonly id: string;
  readonly display_name: string;
  readonly avatar_url: string | null;
  readonly display_user_id: string | null;
}

function readServiceRoleEnv(): { url: string; serviceRoleKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return { url, serviceRoleKey };
}

function extractSortedItemTexts(
  rankingItems: SupabasePublicRankingRow["ranking_items"],
): string[] {
  if (!rankingItems || rankingItems.length === 0) {
    return [];
  }

  return [...rankingItems]
    .sort((a, b) => a.rank - b.rank)
    .map((item) => item.item_text)
    .filter((text) => text.trim() !== "");
}

async function fetchUserProfileRow(
  userIdentifier: string,
  env: { url: string; serviceRoleKey: string },
): Promise<SupabaseUserProfileRow | null> {
  const lookup = toUserProfileLookup(userIdentifier);
  if (!lookup) {
    return null;
  }

  try {
    const query = new URLSearchParams({
      select: "id,display_name,avatar_url,display_user_id",
      limit: "1",
    });
    query.set(lookup.column, `eq.${lookup.value}`);

    const response = await fetch(
      `${env.url}/rest/v1/user_profiles?${query.toString()}`,
      {
        method: "GET",
        headers: {
          apikey: env.serviceRoleKey,
          Authorization: `Bearer ${env.serviceRoleKey}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    const rows = (await response.json()) as SupabaseUserProfileRow[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

function mapToPublicRankingData(
  row: SupabasePublicRankingRow,
  authorProfile: SupabaseUserProfileRow | null,
): PublicRankingData {
  return {
    title: row.title,
    tagName: row.tags?.name ?? "",
    items: extractSortedItemTexts(row.ranking_items),
    authorId: row.user_id,
    authorName: authorProfile?.display_name ?? "ユーザー",
    authorAvatarUrl: authorProfile?.avatar_url ?? null,
    authorDisplayUserId: authorProfile?.display_user_id ?? null,
  };
}

export async function getUserProfile(
  userIdentifier: string,
): Promise<{
  id: string;
  displayName: string;
  avatarUrl: string | null;
  displayUserId: string | null;
} | null> {
  const env = readServiceRoleEnv();
  if (!env) {
    return null;
  }

  const profile = await fetchUserProfileRow(userIdentifier, env);
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    displayUserId: profile.display_user_id,
  };
}

export async function listPublicRankingsByUser(
  userIdentifier: string,
): Promise<ReadonlyArray<{
  id: string;
  title: string;
  tagName: string;
  items: readonly string[];
  createdAt: string;
  viewCount: number;
  bookmarkCount: number;
}>> {
  const env = readServiceRoleEnv();
  if (!env) {
    return [];
  }

  const profile = await fetchUserProfileRow(userIdentifier, env);
  if (!profile) {
    return [];
  }

  const query = new URLSearchParams({
    select:
      "id,user_id,title,tag_id,is_public,created_at,view_count,bookmark_count,ranking_items(rank,item_text),tags(name)",
    user_id: `eq.${profile.id}`,
    is_public: "eq.true",
    order: "created_at.desc",
    "ranking_items.order": "rank.asc",
    "ranking_items.limit": "5",
  });

  try {
    const response = await fetch(
      `${env.url}/rest/v1/rankings?${query.toString()}`,
      {
        method: "GET",
        headers: {
          apikey: env.serviceRoleKey,
          Authorization: `Bearer ${env.serviceRoleKey}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return [];
    }

    type PublicRankingListRow = SupabasePublicRankingRow & {
      readonly created_at: string;
      readonly view_count: number;
      readonly bookmark_count: number;
    };

    const rows = (await response.json()) as PublicRankingListRow[];

    return rows
      .filter((row) => row.is_public === true)
      .map((row) => ({
        id: row.id,
        title: row.title,
        tagName: row.tags?.name ?? "",
        items: extractSortedItemTexts(row.ranking_items),
        createdAt: row.created_at,
        viewCount: row.view_count ?? 0,
        bookmarkCount: row.bookmark_count ?? 0,
      }));
  } catch {
    return [];
  }
}

export async function getPublicRanking(
  rankingId: string,
): Promise<PublicRankingData | null> {
  if (!isUuid(rankingId)) {
    return null;
  }

  const env = readServiceRoleEnv();
  if (!env) {
    return null;
  }

  const query = new URLSearchParams({
    select:
      "id,user_id,title,tag_id,is_public,ranking_items(rank,item_text),tags(name)",
    id: `eq.${rankingId}`,
    is_public: "eq.true",
    limit: "1",
  });

  try {
    const response = await fetch(
      `${env.url}/rest/v1/rankings?${query.toString()}`,
      {
        method: "GET",
        headers: {
          apikey: env.serviceRoleKey,
          Authorization: `Bearer ${env.serviceRoleKey}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    const rows = (await response.json()) as SupabasePublicRankingRow[];
    const row = rows[0];
    if (!row || row.is_public !== true) {
      return null;
    }

    const authorProfile = await fetchUserProfileRow(row.user_id, env);
    return mapToPublicRankingData(row, authorProfile);
  } catch {
    return null;
  }
}
