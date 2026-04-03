import type {
  PublicRankingWithAuthor,
  RecommendCursor,
  SearchPage,
} from "@/lib/types";
import {
  requestSupabase,
  ensureResponseOk,
  mapPublicRankingWithAuthorRow,
  toPostgrestInList,
} from "./supabase-rest";
import { encodeRecommendCursor } from "./search-mappers";

/** ユーザー自身が作成したランキングのタグID一覧を取得する */
export async function getUserOwnTagIds(params: {
  userId: string;
  accessToken: string;
}): Promise<string[]> {
  const query = new URLSearchParams({
    select: "tag_id",
    user_id: `eq.${params.userId}`,
    tag_id: "not.is.null",
  });

  const response = await requestSupabase(`rankings?${query.toString()}`, {
    method: "GET",
    accessToken: params.accessToken,
    prefer: "count=none",
  });
  await ensureResponseOk(response);

  const rows = (await response.json()) as Array<{ tag_id: string }>;
  const uniqueTagIds = [...new Set(rows.map((row) => row.tag_id))];
  return uniqueTagIds;
}

/** ユーザーがブックマークしたランキングのタグID一覧を取得する */
export async function getBookmarkedTagIds(params: {
  userId: string;
  accessToken: string;
}): Promise<string[]> {
  const query = new URLSearchParams({
    select: "rankings(tag_id)",
    user_id: `eq.${params.userId}`,
  });

  const response = await requestSupabase(`bookmarks?${query.toString()}`, {
    method: "GET",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);

  const rows = (await response.json()) as Array<{
    rankings: { tag_id: string | null } | null;
  }>;

  const tagIds = rows
    .map((row) => row.rankings?.tag_id)
    .filter((id): id is string => id !== null && id !== undefined);

  return [...new Set(tagIds)];
}

export interface AffinityTagIds {
  high: string[];
  low: string[];
}

/** ユーザーのタグアフィニティ（high/low）を取得する */
export async function getAffinityTagIds(params: {
  userId: string;
  accessToken: string;
  highThreshold: number;
  lowThreshold: number;
}): Promise<AffinityTagIds> {
  const query = new URLSearchParams({
    select: "tag_id,score",
    user_id: `eq.${params.userId}`,
    score: `gte.${params.lowThreshold}`,
  });

  const response = await requestSupabase(
    `user_tag_affinity?${query.toString()}`,
    {
      method: "GET",
      accessToken: params.accessToken,
    },
  );

  if (!response.ok) {
    if (response.status === 404 || response.status === 400) {
      return { high: [], low: [] };
    }
    throw new Error(`user_tag_affinity query failed (${response.status})`);
  }

  const rows = (await response.json()) as Array<{
    tag_id: string;
    score: number;
  }>;

  const high: string[] = [];
  const low: string[] = [];

  for (const row of rows) {
    if (row.score >= params.highThreshold) {
      high.push(row.tag_id);
    } else {
      low.push(row.tag_id);
    }
  }

  return { high, low };
}

/** 指定タグIDに類似するタグID一覧を取得する */
export async function getSimilarTagIds(params: {
  tagIds: string[];
  minScore: number;
  accessToken: string;
}): Promise<string[]> {
  if (params.tagIds.length === 0) return [];

  const query = new URLSearchParams({
    select: "tag_b_id",
  });
  query.set("tag_a_id", `in.${toPostgrestInList(params.tagIds)}`);
  query.set("score", `gte.${params.minScore}`);

  const response = await requestSupabase(
    `tag_similarities?${query.toString()}`,
    {
      method: "GET",
      accessToken: params.accessToken,
    },
  );

  if (!response.ok) {
    if (response.status === 404 || response.status === 400) {
      return [];
    }
    throw new Error(`tag_similarities query failed (${response.status})`);
  }

  const rows = (await response.json()) as Array<{ tag_b_id: string }>;
  return [...new Set(rows.map((row) => row.tag_b_id))];
}

/** おすすめランキング一覧をRPC経由で取得する（カーソルページネーション） */
export async function listRecommendRankings(params: {
  viewerUserId: string;
  accessToken: string;
  limit: number;
  tier3TagIds: string[];
  tier2TagIds: string[];
  tier1TagIds: string[];
  cursor?: RecommendCursor | null;
}): Promise<SearchPage<PublicRankingWithAuthor>> {
  const rpcBody: Record<string, unknown> = {
    p_viewer_user_id: params.viewerUserId,
    p_limit: params.limit + 1, // hasMore判定用に1件多く取得
    p_tier3_tag_ids: params.tier3TagIds,
    p_tier2_tag_ids: params.tier2TagIds,
    p_tier1_tag_ids: params.tier1TagIds,
  };

  if (params.cursor) {
    rpcBody.p_cursor_priority = params.cursor.priority;
    rpcBody.p_cursor_created_at = params.cursor.createdAt;
    rpcBody.p_cursor_id = params.cursor.id;
  }

  const response = await requestSupabase("rpc/list_recommend_rankings", {
    method: "POST",
    accessToken: params.accessToken,
    body: rpcBody,
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error(`[listRecommendRankings] failed (${response.status})`);
    if (process.env.NODE_ENV !== "production") {
      console.error("[listRecommendRankings] detail:", detail);
    }
    throw new Error(`list_recommend_rankings failed (${response.status})`);
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
    priority: number;
  }>;

  const hasMore = rows.length > params.limit;
  const slicedRows = hasMore ? rows.slice(0, params.limit) : rows;
  const items = slicedRows.map((row) => mapPublicRankingWithAuthorRow(row));

  const lastRow = slicedRows[slicedRows.length - 1];
  const nextCursor =
    hasMore && lastRow
      ? encodeRecommendCursor({
          priority: lastRow.priority,
          createdAt: lastRow.created_at,
          id: lastRow.id,
        })
      : null;

  return { items, nextCursor };
}

/**
 * ユーザーのタグアフィニティを更新する（fire-and-forget用）。
 * エラーが発生しても呼び出し元に影響しない。
 */
export async function updateUserTagAffinity(params: {
  userId: string;
  tagId: string;
  accessToken: string;
}): Promise<void> {
  const rpcBody = {
    p_user_id: params.userId,
    p_tag_id: params.tagId,
  };

  const response = await requestSupabase("rpc/upsert_tag_affinity", {
    method: "POST",
    accessToken: params.accessToken,
    body: rpcBody,
  });

  if (!response.ok) {
    console.error(`[updateUserTagAffinity] failed (${response.status})`);
    if (process.env.NODE_ENV !== "production") {
      const detail = await response.text();
      console.error("[updateUserTagAffinity] detail:", detail);
    }
  }
}
