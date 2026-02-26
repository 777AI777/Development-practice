import type { SupabaseRankingRow } from "@/lib/types";

interface SupabaseEnv {
  url: string;
  serviceRoleKey: string;
}

function readSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return { url, serviceRoleKey };
}

interface SupabaseRequestInit {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  prefer?: string;
}

async function requestSupabase(
  path: string,
  init: SupabaseRequestInit = {},
): Promise<Response> {
  const env = readSupabaseEnv();

  const headers: Record<string, string> = {
    apikey: env.serviceRoleKey,
    Authorization: `Bearer ${env.serviceRoleKey}`,
  };

  if (init.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (init.prefer) {
    headers.Prefer = init.prefer;
  }

  return fetch(`${env.url}/rest/v1/${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
}

function parseItems(row: SupabaseRankingRow): [string, string, string, string, string] {
  const sorted = [...(row.ranking_items ?? [])].sort((a, b) => a.rank - b.rank);
  return [
    sorted[0]?.item_text ?? "",
    sorted[1]?.item_text ?? "",
    sorted[2]?.item_text ?? "",
    sorted[3]?.item_text ?? "",
    sorted[4]?.item_text ?? "",
  ];
}

export function mapRankingRow(row: SupabaseRankingRow) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    tagId: row.tag_id,
    items: parseItems(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ensureResponseOk(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }
  const detail = await response.text();
  throw new Error(`Supabase REST failed (${response.status}): ${detail}`);
}

export async function listRankingsByUser(params: {
  userId: string;
  tagId?: string;
}): Promise<ReturnType<typeof mapRankingRow>[]> {
  const query = new URLSearchParams({
    select: "id,user_id,title,tag_id,created_at,updated_at,ranking_items(rank,item_text)",
    user_id: `eq.${params.userId}`,
    order: "updated_at.desc",
  });
  if (params.tagId) {
    query.set("tag_id", `eq.${params.tagId}`);
  }

  const response = await requestSupabase(`rankings?${query.toString()}`, {
    method: "GET",
  });
  await ensureResponseOk(response);
  const rows = (await response.json()) as SupabaseRankingRow[];
  return rows.map(mapRankingRow);
}

export async function getRankingById(params: {
  userId: string;
  rankingId: string;
}): Promise<ReturnType<typeof mapRankingRow> | null> {
  const query = new URLSearchParams({
    select: "id,user_id,title,tag_id,created_at,updated_at,ranking_items(rank,item_text)",
    id: `eq.${params.rankingId}`,
    user_id: `eq.${params.userId}`,
    limit: "1",
  });

  const response = await requestSupabase(`rankings?${query.toString()}`, {
    method: "GET",
  });
  await ensureResponseOk(response);
  const rows = (await response.json()) as SupabaseRankingRow[];
  const row = rows[0];
  return row ? mapRankingRow(row) : null;
}

export async function createRanking(params: {
  userId: string;
  title: string;
  tagId: string;
  items: [string, string, string, string, string];
}) {
  const rankingInsertResponse = await requestSupabase("rankings", {
    method: "POST",
    prefer: "return=representation",
    body: [
      {
        user_id: params.userId,
        title: params.title,
        tag_id: params.tagId,
      },
    ],
  });
  await ensureResponseOk(rankingInsertResponse);
  const inserted = (await rankingInsertResponse.json()) as Array<{ id: string }>;
  const rankingId = inserted[0]?.id;
  if (!rankingId) {
    throw new Error("Ranking insert did not return id.");
  }

  const itemsBody = params.items.map((item, index) => ({
    ranking_id: rankingId,
    rank: index + 1,
    item_text: item,
  }));

  const itemInsertResponse = await requestSupabase("ranking_items", {
    method: "POST",
    body: itemsBody,
  });
  await ensureResponseOk(itemInsertResponse);
  const created = await getRankingById({ userId: params.userId, rankingId });
  if (!created) {
    throw new Error("Failed to fetch created ranking.");
  }
  return created;
}

export async function updateRanking(params: {
  rankingId: string;
  userId: string;
  title: string;
  tagId: string;
  items: [string, string, string, string, string];
}) {
  const updateQuery = new URLSearchParams({
    id: `eq.${params.rankingId}`,
    user_id: `eq.${params.userId}`,
  });
  const rankingUpdateResponse = await requestSupabase(
    `rankings?${updateQuery.toString()}`,
    {
      method: "PATCH",
      body: {
        title: params.title,
        tag_id: params.tagId,
        updated_at: new Date().toISOString(),
      },
    },
  );
  await ensureResponseOk(rankingUpdateResponse);

  const deleteItemsQuery = new URLSearchParams({ ranking_id: `eq.${params.rankingId}` });
  const deleteItemsResponse = await requestSupabase(
    `ranking_items?${deleteItemsQuery.toString()}`,
    {
      method: "DELETE",
    },
  );
  await ensureResponseOk(deleteItemsResponse);

  const itemInsertResponse = await requestSupabase("ranking_items", {
    method: "POST",
    body: params.items.map((item, index) => ({
      ranking_id: params.rankingId,
      rank: index + 1,
      item_text: item,
    })),
  });
  await ensureResponseOk(itemInsertResponse);

  const updated = await getRankingById({
    userId: params.userId,
    rankingId: params.rankingId,
  });
  if (!updated) {
    throw new Error("Updated ranking could not be loaded.");
  }
  return updated;
}

export async function deleteRanking(params: { rankingId: string; userId: string }) {
  const query = new URLSearchParams({
    id: `eq.${params.rankingId}`,
    user_id: `eq.${params.userId}`,
  });
  const response = await requestSupabase(`rankings?${query.toString()}`, {
    method: "DELETE",
  });
  await ensureResponseOk(response);
}

