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

async function callRpc<T>(
  functionName: string,
  params: Record<string, unknown>,
  accessToken: string,
): Promise<T> {
  const env = readSupabaseEnv();
  const headers: Record<string, string> = {
    apikey: env.anonKey,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
  const response = await fetch(
    `${env.url}/rest/v1/rpc/${functionName}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(params),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { code?: string; message?: string };
    if (err.code === "23P01") {
      throw new ConflictError("Ranking was modified by another request.");
    }
    throw new Error(`RPC ${functionName} failed: ${err.message ?? response.status}`);
  }
  // 204 No Content または空ボディの場合は null を返す
  if (response.status === 204) {
    return null as T;
  }
  const text = await response.text();
  if (!text) {
    return null as T;
  }
  return JSON.parse(text) as T;
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
  const filteredItems = params.items
    .map((text, index) => ({ rank: index + 1, item_text: text }))
    .filter((item) => item.item_text.trim() !== "");

  if (filteredItems.length === 0) {
    throw new Error("Ranking must contain at least one non-empty item.");
  }

  const row = await callRpc<{ id: string }>("create_ranking", {
    p_user_id: params.userId,
    p_title: params.title,
    p_tag_id: params.tagId,
    p_items: filteredItems,
  }, params.accessToken);

  const created = await getRankingById({
    userId: params.userId,
    rankingId: row.id,
    accessToken: params.accessToken,
  });
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
  expectedUpdatedAt: string;
  accessToken: string;
}) {
  const filteredItems = params.items
    .map((text, index) => ({ rank: index + 1, item_text: text }))
    .filter((item) => item.item_text.trim() !== "");

  if (filteredItems.length === 0) {
    throw new Error("Ranking must contain at least one non-empty item.");
  }

  await callRpc<unknown>("update_ranking", {
    p_id: params.rankingId,
    p_user_id: params.userId,
    p_title: params.title,
    p_tag_id: params.tagId,
    p_items: filteredItems,
    p_expected_updated_at: params.expectedUpdatedAt,
  }, params.accessToken);

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
  await callRpc<unknown>("delete_ranking", {
    p_id: params.rankingId,
    p_user_id: params.userId,
    p_expected_updated_at: params.expectedUpdatedAt,
  }, params.accessToken);
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

