/**
 * 認証なしでランキングデータを取得するユーティリティ。
 * OGP画像生成・公開共有ページで使用。
 *
 * Supabase RLS をバイパスするため SUPABASE_SERVICE_ROLE_KEY を使用する。
 * service role key が未設定の場合は null を返す（graceful degradation）。
 */

interface PublicRankingData {
  readonly title: string;
  readonly tagName: string;
  readonly items: readonly string[];
  readonly authorId: string;
  readonly authorName: string;
  readonly authorAvatarUrl: string | null;
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

/** user_profiles VIEW の行型 */
interface SupabaseUserProfileRow {
  readonly id: string;
  readonly display_name: string;
  readonly avatar_url: string | null;
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

/**
 * service_role_key を使って user_profiles VIEW からプロフィールを取得する。
 * 見つからない場合はフォールバック値を返す。
 */
async function fetchUserProfile(
  userId: string,
  env: { url: string; serviceRoleKey: string },
): Promise<{ displayName: string; avatarUrl: string | null }> {
  try {
    const query = new URLSearchParams({
      id: `eq.${userId}`,
      limit: "1",
    });
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
      return { displayName: "ユーザー", avatarUrl: null };
    }
    const rows = (await response.json()) as SupabaseUserProfileRow[];
    const row = rows[0];
    if (!row) {
      return { displayName: "ユーザー", avatarUrl: null };
    }
    return {
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
    };
  } catch {
    return { displayName: "ユーザー", avatarUrl: null };
  }
}

function mapToPublicRankingData(
  row: SupabasePublicRankingRow,
  authorProfile: { displayName: string; avatarUrl: string | null },
): PublicRankingData {
  return {
    title: row.title,
    tagName: row.tags?.name ?? "",
    items: extractSortedItemTexts(row.ranking_items),
    authorId: row.user_id,
    authorName: authorProfile.displayName,
    authorAvatarUrl: authorProfile.avatarUrl,
  };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * service_role で user_profiles VIEW からユーザープロフィールを取得。
 * 公開プロフィールページ用（認証不要）。
 */
export async function getUserProfile(
  userId: string,
): Promise<{ id: string; displayName: string; avatarUrl: string | null } | null> {
  if (!UUID_PATTERN.test(userId)) {
    return null;
  }

  const env = readServiceRoleEnv();
  if (!env) {
    return null;
  }

  const profile = await fetchUserProfile(userId, env);
  // fetchUserProfile はフォールバック値を返すため、
  // ユーザーが実在するかどうかはDB直接確認が必要
  const query = new URLSearchParams({
    select: "id",
    id: `eq.${userId}`,
    limit: "1",
  });

  try {
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

    const rows = (await response.json()) as Array<{ id: string }>;
    if (rows.length === 0) {
      return null;
    }

    return {
      id: userId,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
    };
  } catch {
    return null;
  }
}

/**
 * service_role で特定ユーザーの公開ランキング一覧を取得。
 * 公開プロフィールページ用（認証不要）。
 */
export async function listPublicRankingsByUser(
  userId: string,
): Promise<ReadonlyArray<{
  id: string;
  title: string;
  tagName: string;
  items: readonly string[];
  createdAt: string;
  viewCount: number;
  bookmarkCount: number;
}>> {
  if (!UUID_PATTERN.test(userId)) {
    return [];
  }

  const env = readServiceRoleEnv();
  if (!env) {
    return [];
  }

  const query = new URLSearchParams({
    select:
      "id,user_id,title,tag_id,is_public,created_at,view_count,bookmark_count,ranking_items(rank,item_text),tags(name)",
    user_id: `eq.${userId}`,
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
  if (!UUID_PATTERN.test(rankingId)) {
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
    if (!row) {
      return null;
    }

    // Defense-in-depth: 非公開ランキングの漏洩を防止
    // クエリフィルタ (is_public=eq.true) が誤って削除された場合のガード
    if (row.is_public !== true) {
      return null;
    }

    // 著者プロフィールを取得
    const authorProfile = await fetchUserProfile(row.user_id, env);

    return mapToPublicRankingData(row, authorProfile);
  } catch {
    return null;
  }
}
