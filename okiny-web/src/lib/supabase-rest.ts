import type {
  PublicRankingWithAuthor,
  SupabaseRankingRow,
  SupabaseTagRow,
  UserProfile,
} from "@/lib/types";
import {
  POPULAR_TAGS_CACHE_REVALIDATE_SECONDS,
  RANKING_ITEMS_PREVIEW_LIMIT,
} from "@/lib/constants";
import { isValidDisplayUserId, normalizeDisplayUserId, toUserProfileLookup } from "@/lib/user-utils";

interface SupabaseEnv {
  url: string;
  anonKey: string;
}

interface SupabaseServiceRoleEnv {
  url: string;
  serviceRoleKey: string;
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

function readSupabaseServiceRoleEnv(): SupabaseServiceRoleEnv {
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
  accessToken: string;
}

function toPostgrestInList(values: readonly string[]): string {
  return `(${values
    .map((value) => `"${value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"")}"`)
    .join(",")})`;
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

async function requestSupabaseWithServiceRole(
  path: string,
  init?: Omit<SupabaseRequestInit, "accessToken"> & {
    revalidateSeconds?: number;
  },
): Promise<Response> {
  const env = readSupabaseServiceRoleEnv();
  const headers: Record<string, string> = {
    apikey: env.serviceRoleKey,
    Authorization: `Bearer ${env.serviceRoleKey}`,
  };

  if (init?.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (init?.prefer) {
    headers.Prefer = init.prefer;
  }

  return fetch(`${env.url}/rest/v1/${path}`, {
    method: init?.method ?? "GET",
    headers,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    next:
      init?.revalidateSeconds !== undefined
        ? { revalidate: init.revalidateSeconds }
        : undefined,
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
    isPublic: row.is_public,
    tagName: row.tags?.name,
    items: parseItems(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    viewCount: row.view_count ?? 0,
    impressionCount: row.impression_count ?? 0,
    bookmarkCount: row.bookmark_count ?? 0,
    isBookmarked: false,
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

async function getBookmarkedRankingIds(params: {
  userId: string;
  rankingIds: readonly string[];
  accessToken: string;
}): Promise<Set<string>> {
  if (params.rankingIds.length === 0) {
    return new Set();
  }

  const query = new URLSearchParams({
    select: "ranking_id",
    user_id: `eq.${params.userId}`,
  });
  query.set("ranking_id", `in.${toPostgrestInList(params.rankingIds)}`);

  const response = await requestSupabase(`bookmarks?${query.toString()}`, {
    method: "GET",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);

  const rows = (await response.json()) as Array<{ ranking_id: string }>;
  return new Set(rows.map((row) => row.ranking_id));
}

async function attachBookmarkState(
  rankings: ReturnType<typeof mapRankingRow>[],
  params: { userId: string; accessToken: string },
): Promise<ReturnType<typeof mapRankingRow>[]> {
  const bookmarkedRankingIds = await getBookmarkedRankingIds({
    userId: params.userId,
    rankingIds: rankings.map((ranking) => ranking.id),
    accessToken: params.accessToken,
  });

  return rankings.map((ranking) => ({
    ...ranking,
    isBookmarked: bookmarkedRankingIds.has(ranking.id),
  }));
}

function mapUserProfileRow(row: {
  id: string;
  display_name: string;
  avatar_url: string | null;
  display_user_id: string | null;
}): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    displayUserId: row.display_user_id,
  };
}

class PublicRankingsByTagRpcUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicRankingsByTagRpcUnavailableError";
  }
}

function mapPublicRankingWithAuthorRow(row: {
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
  const ranking = mapRankingRow({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    tag_id: row.tag_id,
    is_public: row.is_public,
    created_at: row.created_at,
    updated_at: row.updated_at,
    view_count: row.view_count,
    impression_count: row.impression_count,
    bookmark_count: row.bookmark_count,
    ranking_items: row.ranking_items ?? [],
    tags: row.tag_name ? { name: row.tag_name } : undefined,
  });

  return {
    ...ranking,
    isBookmarked: row.is_bookmarked,
    author: {
      id: row.user_id,
      displayName: row.author_display_name ?? "ユーザー",
      avatarUrl: row.author_avatar_url,
      displayUserId: row.author_display_user_id,
    },
  };
}


export async function listRankingsByUser(params: {
  userId: string;
  tagId?: string;
  accessToken: string;
}): Promise<ReturnType<typeof mapRankingRow>[]> {
  const query = new URLSearchParams({
    select: "id,user_id,title,tag_id,is_public,created_at,updated_at,view_count,impression_count,bookmark_count,ranking_items(rank,item_text),tags(name)",
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
    select: "id,user_id,title,tag_id,is_public,created_at,updated_at,view_count,impression_count,bookmark_count,ranking_items(rank,item_text),tags(name)",
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
  isPublic: boolean;
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
    p_is_public: params.isPublic,
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
  isPublic: boolean;
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
    p_is_public: params.isPublic,
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
  const res = await requestSupabase(`tag_popularity?${query.toString()}`, {
    method: "GET",
    accessToken,
  });
  await ensureResponseOk(res);
  return (await res.json()) as SupabaseTagRow[];
}

export async function listPopularTagsCached(
  options?: { limit?: number },
): Promise<SupabaseTagRow[]> {
  const query = new URLSearchParams({
    select: "*",
    order: "usage_count.desc,created_at.asc",
  });
  if (options?.limit !== undefined) {
    query.set("limit", String(options.limit));
  }

  const res = await requestSupabaseWithServiceRole(
    `tag_popularity?${query.toString()}`,
    {
      method: "GET",
      revalidateSeconds: POPULAR_TAGS_CACHE_REVALIDATE_SECONDS,
    },
  );
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

// ---------------------------------------------------------------------------
// 公開ランキング・閲覧記録・ブックマーク・ユーザープロフィール
// ---------------------------------------------------------------------------

/**
 * 公開ランキングをIDで取得（user_idフィルタなし、is_public=true のみ）。
 * 認証ユーザーのアクセストークンで取得するが、所有者制限はかけない。
 */
export async function getPublicRankingById(params: {
  rankingId: string;
  userId?: string;
  accessToken: string;
}): Promise<ReturnType<typeof mapRankingRow> | null> {
  const query = new URLSearchParams({
    select: "id,user_id,title,tag_id,is_public,created_at,updated_at,view_count,impression_count,bookmark_count,ranking_items(rank,item_text),tags(name)",
    id: `eq.${params.rankingId}`,
    is_public: "eq.true",
    limit: "1",
  });

  const response = await requestSupabase(`rankings?${query.toString()}`, {
    method: "GET",
    accessToken: params.accessToken,
  });
  if (!response.ok) {
    return null;
  }
  const rows = (await response.json()) as SupabaseRankingRow[];
  const row = rows[0];
  if (!row) {
    return null;
  }

  const ranking = mapRankingRow(row);
  if (!params.userId) {
    return ranking;
  }

  const bookmarkedRankingIds = await getBookmarkedRankingIds({
    userId: params.userId,
    rankingIds: [ranking.id],
    accessToken: params.accessToken,
  });

  return {
    ...ranking,
    isBookmarked: bookmarkedRankingIds.has(ranking.id),
  };
}

/**
 * ランキングの view_count をアトミックに +1 する（RPC: increment_view_count）。
 * 重複防止はクライアント側の SessionStorage で制御する。
 */
export async function incrementViewCount(params: {
  rankingId: string;
  accessToken: string;
}): Promise<void> {
  await callRpc<unknown>("increment_view_count", {
    p_ranking_id: params.rankingId,
  }, params.accessToken);
}

/**
 * ランキングの impression_count をバッチで +1 する（RPC: increment_impression_count）。
 * 一覧表示時にまとめて呼び出す。空配列の場合は何もしない。
 */
export async function incrementImpressionCount(params: {
  rankingIds: string[];
  accessToken: string;
}): Promise<void> {
  if (params.rankingIds.length === 0) return;
  await callRpc<unknown>("increment_impression_count", {
    p_ranking_ids: params.rankingIds,
  }, params.accessToken);
}

/**
 * display_user_id の利用可能性を確認する（一意性チェック）。
 * service_role_key を使って user_profiles VIEW を参照する。
 * @returns true: 利用可能（未使用）, false: 既に使用中
 */
export async function checkDisplayUserIdAvailability(
  displayUserId: string,
): Promise<boolean> {
  const normalizedValue = normalizeDisplayUserId(displayUserId);

  if (!isValidDisplayUserId(normalizedValue)) {
    throw new Error("Invalid display_user_id format");
  }

  const query = new URLSearchParams({
    select: "id",
    display_user_id: `eq.${normalizedValue}`,
    limit: "1",
  });

  const response = await requestSupabaseWithServiceRole(
    `user_profiles?${query.toString()}`,
    { revalidateSeconds: 0 },
  );
  await ensureResponseOk(response);

  const rows = (await response.json()) as Array<{ id: string }>;
  return rows.length === 0;
}

/**
 * service_role_key を使って user_profiles VIEW からユーザー情報を取得する。
 * 一覧・詳細の著者情報はこの server-only の経路に集約する。
 */
export async function getUserProfile(
  userIdentifier: string,
): Promise<UserProfile | null> {
  const lookup = toUserProfileLookup(userIdentifier);

  if (!lookup) {
    return null;
  }

  const env = readSupabaseServiceRoleEnv();
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
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[getUserProfile] failed: ${response.status} ${response.statusText}`);
    }
    return null;
  }

  const rows = (await response.json()) as Array<{
    id: string;
    display_name: string;
    avatar_url: string | null;
    display_user_id: string | null;
  }>;

  const row = rows[0];
  return row ? mapUserProfileRow(row) : null;
}

/**
 * タグ指定で他ユーザーの公開ランキングを取得する（自分を除外）。
 * 検索ページのタグ選択時に使用。
 */
export async function listPublicRankingsByTag(params: {
  tagId: string;
  viewerUserId: string;
  accessToken: string;
}): Promise<ReturnType<typeof mapRankingRow>[]> {
  const query = new URLSearchParams({
    select: "id,user_id,title,tag_id,is_public,created_at,updated_at,view_count,impression_count,bookmark_count,ranking_items(rank,item_text),tags(name)",
    is_public: "eq.true",
    user_id: `neq.${params.viewerUserId}`,
    tag_id: `eq.${params.tagId}`,
    order: "created_at.desc",
  });
  query.set("ranking_items.order", "rank.asc");
  query.set("ranking_items.limit", String(RANKING_ITEMS_PREVIEW_LIMIT));

  const response = await requestSupabase(`rankings?${query.toString()}`, {
    method: "GET",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);
  const rows = (await response.json()) as SupabaseRankingRow[];
  return attachBookmarkState(rows.map(mapRankingRow), {
    userId: params.viewerUserId,
    accessToken: params.accessToken,
  });
}

export async function listPublicRankingsByTagWithAuthors(params: {
  tagId: string;
  viewerUserId: string;
  accessToken: string;
}): Promise<PublicRankingWithAuthor[]> {
  try {
    const response = await requestSupabase("rpc/list_public_rankings_by_tag", {
      method: "POST",
      accessToken: params.accessToken,
      body: {
        p_tag_id: params.tagId,
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      if (detail.includes("PGRST202")) {
        throw new PublicRankingsByTagRpcUnavailableError(
          "list_public_rankings_by_tag RPC is unavailable.",
        );
      }
      throw new Error(`list_public_rankings_by_tag failed (${response.status})`);
    }

    const rows = (await response.json()) as Array<{
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
    }>;

    return rows
      .filter((row) => row.user_id !== params.viewerUserId)
      .map(mapPublicRankingWithAuthorRow);
  } catch (error) {
    if (!(error instanceof PublicRankingsByTagRpcUnavailableError)) {
      throw error;
    }

    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[listPublicRankingsByTagWithAuthors] RPC unavailable, falling back to REST composition.",
      );
    }

    const rankings = await listPublicRankingsByTag(params);
    const uniqueUserIds = [...new Set(rankings.map((ranking) => ranking.userId))];
    const profiles = await getUserProfilesBatch(uniqueUserIds);
    const profileMap = new Map<string, UserProfile>(
      profiles.map((profile) => [profile.id, profile]),
    );

    return rankings.map((ranking) => ({
      ...ranking,
      author: profileMap.get(ranking.userId) ?? {
        id: ranking.userId,
        displayName: "ユーザー",
        avatarUrl: null,
        displayUserId: null,
      },
    }));
  }
}

/**
 * service_role_key を使って複数ユーザーのプロフィールを一括取得する。
 */
export async function getUserProfilesBatch(
  userIds: string[],
): Promise<UserProfile[]> {
  if (userIds.length === 0) return [];
  const uniqueUserIds = [...new Set(userIds)];

  const results = await Promise.all(
    uniqueUserIds.map((id) => getUserProfile(id)),
  );

  return results.filter(
    (profile): profile is UserProfile => profile !== null,
  );
}

/**
 * 指定ユーザーの公開ランキング一覧を取得する。
 * プロフィールページで使用。
 */
export async function listPublicRankingsByUser(params: {
  userId: string;
  accessToken: string;
}): Promise<ReturnType<typeof mapRankingRow>[]> {
  const query = new URLSearchParams({
    select: "id,user_id,title,tag_id,is_public,created_at,updated_at,view_count,impression_count,bookmark_count,ranking_items(rank,item_text),tags(name)",
    user_id: `eq.${params.userId}`,
    is_public: "eq.true",
    order: "updated_at.desc",
  });
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

/**
 * ブックマークを追加する。
 * bookmarks テーブルに直接 INSERT（UNIQUE制約で重複防止）。
 */
export async function addBookmark(params: {
  userId: string;
  rankingId: string;
  accessToken: string;
}): Promise<void> {
  const response = await requestSupabase("bookmarks", {
    method: "POST",
    accessToken: params.accessToken,
    prefer: "return=minimal",
    body: [{ user_id: params.userId, ranking_id: params.rankingId }],
  });
  // 409 Conflict（既にブックマーク済み）は正常として扱う
  if (response.status === 409) {
    return;
  }
  await ensureResponseOk(response);
}

/**
 * ブックマークを削除する。
 */
export async function removeBookmark(params: {
  userId: string;
  rankingId: string;
  accessToken: string;
}): Promise<void> {
  const query = new URLSearchParams({
    user_id: `eq.${params.userId}`,
    ranking_id: `eq.${params.rankingId}`,
  });
  const response = await requestSupabase(`bookmarks?${query.toString()}`, {
    method: "DELETE",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);
}

/**
 * ユーザーのブックマーク一覧を取得する。
 * bookmarks テーブルから ranking_id を取得し、ランキング詳細を JOIN で返す。
 */
export async function listBookmarkedRankings(params: {
  userId: string;
  accessToken: string;
}): Promise<ReturnType<typeof mapRankingRow>[]> {
  // bookmarks テーブルから rankings を JOIN して取得
  const query = new URLSearchParams({
    select: "ranking_id,rankings(id,user_id,title,tag_id,is_public,created_at,updated_at,view_count,impression_count,bookmark_count,ranking_items(rank,item_text),tags(name))",
    user_id: `eq.${params.userId}`,
    order: "created_at.desc",
  });
  query.set("rankings.ranking_items.order", "rank.asc");
  query.set("rankings.ranking_items.limit", String(RANKING_ITEMS_PREVIEW_LIMIT));

  const response = await requestSupabase(`bookmarks?${query.toString()}`, {
    method: "GET",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);

  const rows = (await response.json()) as Array<{
    ranking_id: string;
    rankings: SupabaseRankingRow | null;
  }>;

  // rankings が null のもの（削除済み等）はスキップ
  return rows
    .filter((row): row is { ranking_id: string; rankings: SupabaseRankingRow } => row.rankings !== null)
    .map((row) => ({
      ...mapRankingRow(row.rankings),
      isBookmarked: true,
    }));
}


