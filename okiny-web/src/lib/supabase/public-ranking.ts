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
}

interface SupabasePublicRankingRow {
  readonly id: string;
  readonly title: string;
  readonly tag_id: string;
  readonly ranking_items?: ReadonlyArray<{
    readonly rank: number;
    readonly item_text: string;
  }>;
  readonly tags?: { readonly name: string };
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

function mapToPublicRankingData(
  row: SupabasePublicRankingRow,
): PublicRankingData {
  return {
    title: row.title,
    tagName: row.tags?.name ?? "",
    items: extractSortedItemTexts(row.ranking_items),
  };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    select: "id,title,tag_id,ranking_items(rank,item_text),tags(name)",
    id: `eq.${rankingId}`,
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

    return mapToPublicRankingData(row);
  } catch {
    return null;
  }
}
