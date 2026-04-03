import type { PublicRankingWithAuthor, SearchCursor, SearchPage, UserProfile } from "@/lib/types";
import {
  requestSupabase,
  requestSupabaseWithServiceRole,
  ensureResponseOk,
  toPostgrestInList,
  getUserProfilesBatch,
  mapPublicRankingWithAuthorRow,
} from "./supabase-rest";
import { encodeCursor } from "./search-mappers";

/**
 * フォローを追加する（冪等 — 409 Conflict は握りつぶす）。
 * パターン: addBookmark と同じ。
 */
export async function addFollow(params: {
  followerId: string;
  followingId: string;
  accessToken: string;
}): Promise<void> {
  const response = await requestSupabase("follows", {
    method: "POST",
    accessToken: params.accessToken,
    prefer: "return=minimal",
    body: [{ follower_id: params.followerId, following_id: params.followingId }],
  });
  // 409 Conflict（既にフォロー済み）は正常として扱う
  if (response.status === 409) {
    return;
  }
  await ensureResponseOk(response);
}

/**
 * フォローを解除する（冪等）。
 * パターン: removeBookmark と同じ。
 */
export async function removeFollow(params: {
  followerId: string;
  followingId: string;
  accessToken: string;
}): Promise<void> {
  const query = new URLSearchParams({
    follower_id: `eq.${params.followerId}`,
    following_id: `eq.${params.followingId}`,
  });
  const response = await requestSupabase(`follows?${query.toString()}`, {
    method: "DELETE",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);
}

/**
 * フォロワーを削除する（自分のフォロワーから指定ユーザーを除去）。
 *
 * RLSでは follower_id = auth.uid() のDELETEのみ許可されている。
 * フォロワー削除は following_id 側（=自分）が follower_id 側の行を消す操作のため、
 * 既存のRLSポリシーでは対応できず、service_roleでバイパスする。
 *
 * セキュリティ: この関数の ownUserId は、呼び出し元のAPIルートで
 * auth.userId（認証済みユーザーID）から取得するため、
 * 他人のフォロワーを削除する攻撃は成立しない。
 *
 * 冪等設計: 該当行が存在しなくても正常終了。
 */
export async function removeFollower(params: {
  ownUserId: string;
  followerId: string;
}): Promise<void> {
  const query = new URLSearchParams({
    follower_id: `eq.${params.followerId}`,
    following_id: `eq.${params.ownUserId}`,
  });
  const response = await requestSupabaseWithServiceRole(
    `follows?${query.toString()}`,
    { method: "DELETE" },
  );
  await ensureResponseOk(response);
}

/**
 * 指定ユーザーIDリストのうちフォロー済みのIDを Set で返す。
 * パターン: getBookmarkedRankingIds と同じ。
 */
export async function getFollowingUserIds(params: {
  followerId: string;
  targetUserIds: readonly string[];
  accessToken: string;
}): Promise<Set<string>> {
  if (params.targetUserIds.length === 0) {
    return new Set();
  }

  const query = new URLSearchParams({
    select: "following_id",
    follower_id: `eq.${params.followerId}`,
  });
  query.set("following_id", `in.${toPostgrestInList(params.targetUserIds)}`);

  const response = await requestSupabase(`follows?${query.toString()}`, {
    method: "GET",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);

  const rows = (await response.json()) as Array<{ following_id: string }>;
  return new Set(rows.map((row) => row.following_id));
}

/**
 * 指定ユーザーのフォロワー一覧を UserProfile[] で返す。
 * follows テーブルから follower_id を取得 → getUserProfilesBatch で解決。
 */
export async function listFollowers(params: {
  userId: string;
}): Promise<UserProfile[]> {
  const query = new URLSearchParams({
    select: "follower_id",
    following_id: `eq.${params.userId}`,
    order: "created_at.desc",
  });

  const response = await requestSupabaseWithServiceRole(
    `follows?${query.toString()}`,
  );
  await ensureResponseOk(response);

  const rows = (await response.json()) as Array<{ follower_id: string }>;
  const userIds = rows.map((row) => row.follower_id);
  return getUserProfilesBatch(userIds);
}

/**
 * 指定ユーザーのフォロー一覧を UserProfile[] で返す。
 * follows テーブルから following_id を取得 → getUserProfilesBatch で解決。
 */
export async function listFollowing(params: {
  userId: string;
}): Promise<UserProfile[]> {
  const query = new URLSearchParams({
    select: "following_id",
    follower_id: `eq.${params.userId}`,
    order: "created_at.desc",
  });

  const response = await requestSupabaseWithServiceRole(
    `follows?${query.toString()}`,
  );
  await ensureResponseOk(response);

  const rows = (await response.json()) as Array<{ following_id: string }>;
  const userIds = rows.map((row) => row.following_id);
  return getUserProfilesBatch(userIds);
}

/**
 * フォローユーザーの公開ランキング一覧を取得する（カーソルページネーション）。
 * RPC: list_following_rankings を呼び出し。
 * パターン: searchRankings の cursor ページネーションと同じ。
 */
export async function listFollowingRankings(params: {
  viewerUserId: string;
  accessToken: string;
  limit: number;
  cursor?: SearchCursor | null;
}): Promise<SearchPage<PublicRankingWithAuthor>> {
  const rpcBody: Record<string, unknown> = {
    p_viewer_user_id: params.viewerUserId,
    p_limit: params.limit,
  };
  if (params.cursor) {
    rpcBody.p_cursor_created_at = params.cursor.createdAt;
    rpcBody.p_cursor_id = params.cursor.id;
  }

  const response = await requestSupabase("rpc/list_following_rankings", {
    method: "POST",
    accessToken: params.accessToken,
    body: rpcBody,
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error(`[listFollowingRankings] failed (${response.status})`);
    if (process.env.NODE_ENV !== "production") {
      console.error("[listFollowingRankings] detail:", detail);
    }
    throw new Error(`list_following_rankings failed (${response.status})`);
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

  const hasMore = rows.length > params.limit;
  const slicedRows = hasMore ? rows.slice(0, params.limit) : rows;
  const items = slicedRows.map(mapPublicRankingWithAuthorRow);

  const lastItem = items[items.length - 1];
  const nextCursor =
    hasMore && lastItem
      ? encodeCursor({ createdAt: lastItem.createdAt, id: lastItem.id })
      : null;

  return { items, nextCursor };
}
