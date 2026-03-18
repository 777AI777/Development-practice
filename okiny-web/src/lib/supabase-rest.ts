import type { SupabaseRankingRow, SupabaseTagRow } from "@/lib/types";
import { RANKING_ITEMS_PREVIEW_LIMIT } from "@/lib/constants";

interface SupabaseEnv {
  url: string;
  anonKey: string;
}

function readSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }
  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured.");
  }

  return { url, anonKey };
}

interface SupabaseRequestInit {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  prefer?: string;
  accessToken: string;
}

async function requestSupabase(
  path: string,
  init: SupabaseRequestInit,
): Promise<Response> {
  const env = readSupabaseEnv();

  const headers: Record<string, string> = {
    apikey: env.anonKey,
    Authorization: `Bearer ${init.accessToken}`,
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
    tagName: row.tags?.name,
    items: parseItems(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

async function ensureResponseOk(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }
  const detail = await response.text();
  if (process.env.NODE_ENV !== "production") {
    console.error("[supabase-rest] error detail:", detail);
  }
  throw new Error(`Supabase REST failed (${response.status})`);
}

function buildRankingItemsPayload(params: {
  rankingId: string;
  items: [string, string, string, string, string];
}) {
  return params.items
    .map((item, index) => ({
      ranking_id: params.rankingId,
      rank: index + 1,
      item_text: item.trim(),
    }))
    .filter((item) => item.item_text.length > 0);
}

async function deleteRankingById(rankingId: string, accessToken: string): Promise<void> {
  const query = new URLSearchParams({ id: `eq.${rankingId}` });
  const response = await requestSupabase(`rankings?${query.toString()}`, {
    method: "DELETE",
    accessToken,
  });
  await ensureResponseOk(response);
}

export async function listRankingsByUser(params: {
  userId: string;
  tagId?: string;
  accessToken: string;
}): Promise<ReturnType<typeof mapRankingRow>[]> {
  const query = new URLSearchParams({
    select: "id,user_id,title,tag_id,created_at,updated_at,ranking_items(rank,item_text),tags(name)",
    user_id: `eq.${params.userId}`,
    order: "updated_at.desc",
  });
  if (params.tagId) {
    query.set("tag_id", `eq.${params.tagId}`);
  }
  query.set("ranking_items.order", "rank.asc");
  query.set("ranking_items.limit", String(RANKING_ITEMS_PREVIEW_LIMIT));

  const response = await requestSupabase(`rankings?${query.toString()}`, {
    method: "GET",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);
  const rows = (await response.json()) as SupabaseRankingRow[];
  return rows.map(mapRankingRow);
}

export async function getRankingById(params: {
  userId: string;
  rankingId: string;
  accessToken: string;
}): Promise<ReturnType<typeof mapRankingRow> | null> {
  const query = new URLSearchParams({
    select: "id,user_id,title,tag_id,created_at,updated_at,ranking_items(rank,item_text),tags(name)",
    id: `eq.${params.rankingId}`,
    user_id: `eq.${params.userId}`,
    limit: "1",
  });

  const response = await requestSupabase(`rankings?${query.toString()}`, {
    method: "GET",
    accessToken: params.accessToken,
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
  accessToken: string;
}) {
  const rankingInsertResponse = await requestSupabase("rankings", {
    method: "POST",
    prefer: "return=representation",
    accessToken: params.accessToken,
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

  const itemsBody = buildRankingItemsPayload({
    rankingId,
    items: params.items,
  });
  if (itemsBody.length === 0) {
    await deleteRankingById(rankingId, params.accessToken);
    throw new Error("Ranking must contain at least one non-empty item.");
  }

  try {
    const itemInsertResponse = await requestSupabase("ranking_items", {
      method: "POST",
      accessToken: params.accessToken,
      body: itemsBody,
    });
    await ensureResponseOk(itemInsertResponse);
  } catch (error) {
    try {
      await deleteRankingById(rankingId, params.accessToken);
    } catch {
      // best-effort rollback
    }
    throw error;
  }
  const created = await getRankingById({ userId: params.userId, rankingId, accessToken: params.accessToken });
  if (!created) {
    throw new Error("Failed to fetch created ranking.");
  }
  return created;
}

async function replaceRankingItems(params: {
  rankingId: string;
  itemsBody: Array<{ ranking_id: string; rank: number; item_text: string }>;
  accessToken: string;
}): Promise<void> {
  const deleteQuery = new URLSearchParams({ ranking_id: `eq.${params.rankingId}` });
  const deleteResponse = await requestSupabase(
    `ranking_items?${deleteQuery.toString()}`,
    {
      method: "DELETE",
      accessToken: params.accessToken,
    },
  );
  await ensureResponseOk(deleteResponse);

  const insertResponse = await requestSupabase("ranking_items", {
    method: "POST",
    accessToken: params.accessToken,
    body: params.itemsBody,
  });
  await ensureResponseOk(insertResponse);
}

async function restoreRankingItems(params: {
  ranking: ReturnType<typeof mapRankingRow>;
  userId: string;
  accessToken: string;
}): Promise<void> {
  const restoreRankingResponse = await requestSupabase(
    `rankings?${new URLSearchParams({
      id: `eq.${params.ranking.id}`,
      user_id: `eq.${params.userId}`,
    }).toString()}`,
    {
      method: "PATCH",
      accessToken: params.accessToken,
      body: {
        title: params.ranking.title,
        tag_id: params.ranking.tagId,
        updated_at: params.ranking.updatedAt,
      },
    },
  );
  await ensureResponseOk(restoreRankingResponse);

  const restoreItemsResponse = await requestSupabase("ranking_items", {
    method: "POST",
    accessToken: params.accessToken,
    body: params.ranking.items.map((item, index) => ({
      ranking_id: params.ranking.id,
      rank: index + 1,
      item_text: item,
    })),
  });
  await ensureResponseOk(restoreItemsResponse);
}

export async function updateRanking(params: {
  rankingId: string;
  userId: string;
  title: string;
  tagId: string;
  items: [string, string, string, string, string];
  expectedUpdatedAt: string;
  accessToken: string;
}) {
  const previous = await getRankingById({
    userId: params.userId,
    rankingId: params.rankingId,
    accessToken: params.accessToken,
  });
  if (!previous) {
    throw new Error("Ranking not found.");
  }
  if (previous.updatedAt !== params.expectedUpdatedAt) {
    throw new ConflictError("Ranking was modified by another request.");
  }

  const itemsBody = buildRankingItemsPayload({
    rankingId: params.rankingId,
    items: params.items,
  });
  if (itemsBody.length === 0) {
    throw new Error("Ranking must contain at least one non-empty item.");
  }

  const updateQuery = new URLSearchParams({
    id: `eq.${params.rankingId}`,
    user_id: `eq.${params.userId}`,
    updated_at: `eq.${params.expectedUpdatedAt}`,
  });
  const rankingUpdateResponse = await requestSupabase(
    `rankings?${updateQuery.toString()}`,
    {
      method: "PATCH",
      prefer: "return=representation",
      accessToken: params.accessToken,
      body: {
        title: params.title,
        tag_id: params.tagId,
        updated_at: new Date().toISOString(),
      },
    },
  );
  await ensureResponseOk(rankingUpdateResponse);
  const updatedRows = (await rankingUpdateResponse.json()) as Array<{ id: string }>;
  if (updatedRows.length === 0) {
    throw new ConflictError("Ranking was modified by another request.");
  }

  try {
    await replaceRankingItems({
      rankingId: params.rankingId,
      itemsBody,
      accessToken: params.accessToken,
    });
  } catch (error) {
    try {
      await restoreRankingItems({
        ranking: previous,
        userId: params.userId,
        accessToken: params.accessToken,
      });
    } catch {
      // best-effort rollback
    }
    throw error;
  }

  const updated = await getRankingById({
    userId: params.userId,
    rankingId: params.rankingId,
    accessToken: params.accessToken,
  });
  if (!updated) {
    throw new Error("Updated ranking could not be loaded.");
  }
  return updated;
}

export async function deleteRanking(params: {
  rankingId: string;
  userId: string;
  expectedUpdatedAt: string;
  accessToken: string;
}) {
  const existing = await getRankingById({
    userId: params.userId,
    rankingId: params.rankingId,
    accessToken: params.accessToken,
  });
  if (!existing) {
    return;
  }
  if (existing.updatedAt !== params.expectedUpdatedAt) {
    throw new ConflictError("Ranking was modified by another request.");
  }

  const deleteItemsQuery = new URLSearchParams({ ranking_id: `eq.${params.rankingId}` });
  try {
    const deleteItemsResponse = await requestSupabase(
      `ranking_items?${deleteItemsQuery.toString()}`,
      {
        method: "DELETE",
        accessToken: params.accessToken,
      },
    );
    await ensureResponseOk(deleteItemsResponse);

    const query = new URLSearchParams({
      id: `eq.${params.rankingId}`,
      user_id: `eq.${params.userId}`,
      updated_at: `eq.${params.expectedUpdatedAt}`,
    });
    const response = await requestSupabase(`rankings?${query.toString()}`, {
      method: "DELETE",
      prefer: "return=representation",
      accessToken: params.accessToken,
    });
    await ensureResponseOk(response);
    const deletedRows = (await response.json()) as Array<{ id: string }>;
    if (deletedRows.length === 0) {
      throw new ConflictError("Ranking was modified by another request.");
    }
  } catch (error) {
    try {
      const restoreItemsResponse = await requestSupabase("ranking_items", {
        method: "POST",
        accessToken: params.accessToken,
        body: existing.items.map((item, index) => ({
          ranking_id: existing.id,
          rank: index + 1,
          item_text: item,
        })),
      });
      await ensureResponseOk(restoreItemsResponse);
    } catch {
      // best-effort rollback
    }
    throw error;
  }
}

/**
 * ユーザーが使用したタグの詳細+使用回数を取得（RPC: GROUP BY + JOIN）
 */
export async function getUserTagUsage(params: {
  userId: string;
  accessToken: string;
  limit: number;
}): Promise<Array<{
  tag_id: string;
  tag_name: string;
  tag_readings: string[];
  tag_usage_count: number;
  tag_created_at: string;
  my_usage_count: number;
}>> {
  const body = {
    p_user_id: params.userId,
    p_limit: params.limit,
  };
  const res = await requestSupabase("rpc/get_user_tag_usage", {
    method: "POST",
    accessToken: params.accessToken,
    body,
  });
  await ensureResponseOk(res);
  return (await res.json()) as Array<{
    tag_id: string;
    tag_name: string;
    tag_readings: string[];
    tag_usage_count: number;
    tag_created_at: string;
    my_usage_count: number;
  }>;
}

export async function listTags(
  accessToken: string,
  options?: { limit?: number },
): Promise<SupabaseTagRow[]> {
  const query = new URLSearchParams({
    select: "*",
    order: "usage_count.desc,created_at.asc",
  });
  if (options?.limit !== undefined) {
    query.set("limit", String(options.limit));
  }
  const res = await requestSupabase(`tags?${query.toString()}`, {
    method: "GET",
    accessToken,
  });
  await ensureResponseOk(res);
  return (await res.json()) as SupabaseTagRow[];
}

export async function searchTagsUnified(params: {
  query: string;
  katakanaQuery: string;
  limit: number;
  accessToken: string;
}): Promise<SupabaseTagRow[]> {
  const res = await requestSupabase("rpc/search_tags_unified", {
    method: "POST",
    accessToken: params.accessToken,
    body: {
      p_query: params.query,
      p_katakana_query: params.katakanaQuery,
      p_limit: params.limit,
    },
  });
  await ensureResponseOk(res);
  return (await res.json()) as SupabaseTagRow[];
}

export async function createTag(
  tag: { name: string; readings: string[] },
  accessToken: string,
): Promise<SupabaseTagRow> {
  const res = await requestSupabase("tags", {
    method: "POST",
    prefer: "return=representation",
    accessToken,
    body: [tag],
  });
  await ensureResponseOk(res);
  const rows = (await res.json()) as SupabaseTagRow[];
  const created = rows[0];
  if (!created) {
    throw new Error("Tag creation did not return a row");
  }
  return created;
}

export async function appendTagReading(
  tagId: string,
  newReadings: string[],
  existingReadings: string[],
  accessToken: string,
): Promise<void> {
  // Filter to only truly new readings
  const uniqueNew = newReadings.filter((r) => !existingReadings.includes(r));
  if (uniqueNew.length === 0) return;

  const res = await requestSupabase("rpc/append_tag_readings", {
    method: "POST",
    accessToken,
    body: {
      p_tag_id: tagId,
      p_new_readings: uniqueNew,
    },
  });
  await ensureResponseOk(res);
}

export async function getTagByName(
  name: string,
  accessToken: string,
): Promise<SupabaseTagRow | null> {
  const query = new URLSearchParams({
    name: `eq.${name}`,
    select: "*",
  });
  const res = await requestSupabase(`tags?${query.toString()}`, {
    method: "GET",
    accessToken,
  });
  await ensureResponseOk(res);
  const rows = (await res.json()) as SupabaseTagRow[];
  return rows[0] ?? null;
}

