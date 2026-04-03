import type { UserProfile, UserRelationship } from "@/lib/types";
import {
  requestSupabase,
  requestSupabaseWithServiceRole,
  ensureResponseOk,
  toPostgrestInList,
  getUserProfilesBatch,
} from "./supabase-rest";
import { getFollowingUserIds } from "./supabase-rest-follows";
import { getMutedUserIds } from "./supabase-rest-mutes";

/**
 * ブロックを追加する（冪等 — 409 Conflict は握りつぶす）。
 * パターン: addFollow と同じ。
 */
export async function addBlock(params: {
  userId: string;
  blockedId: string;
  accessToken: string;
}): Promise<void> {
  const response = await requestSupabase("blocks", {
    method: "POST",
    accessToken: params.accessToken,
    prefer: "return=minimal",
    body: [{ user_id: params.userId, blocked_id: params.blockedId }],
  });
  // 409 Conflict（既にブロック済み）は正常として扱う
  if (response.status === 409) {
    return;
  }
  await ensureResponseOk(response);
}

/**
 * ブロックを解除する（冪等）。
 * パターン: removeFollow と同じ。
 */
export async function removeBlock(params: {
  userId: string;
  blockedId: string;
  accessToken: string;
}): Promise<void> {
  const query = new URLSearchParams({
    user_id: `eq.${params.userId}`,
    blocked_id: `eq.${params.blockedId}`,
  });
  const response = await requestSupabase(`blocks?${query.toString()}`, {
    method: "DELETE",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);
}

/**
 * 指定ユーザーIDリストのうちブロック済みのIDを Set で返す（自分がブロックした側）。
 * パターン: getFollowingUserIds と同じ。
 */
export async function getBlockedUserIds(params: {
  userId: string;
  targetUserIds: readonly string[];
  accessToken: string;
}): Promise<Set<string>> {
  if (params.targetUserIds.length === 0) {
    return new Set();
  }

  const query = new URLSearchParams({
    select: "blocked_id",
    user_id: `eq.${params.userId}`,
  });
  query.set("blocked_id", `in.${toPostgrestInList(params.targetUserIds)}`);

  const response = await requestSupabase(`blocks?${query.toString()}`, {
    method: "GET",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);

  const rows = (await response.json()) as Array<{ blocked_id: string }>;
  return new Set(rows.map((row) => row.blocked_id));
}

/**
 * 相手にブロックされているかチェックする。
 * userId（自分）が blockedById（相手）にブロックされているか。
 */
export async function isBlockedBy(params: {
  userId: string;
  blockedById: string;
  accessToken: string;
}): Promise<boolean> {
  const query = new URLSearchParams({
    select: "user_id",
    user_id: `eq.${params.blockedById}`,
    blocked_id: `eq.${params.userId}`,
  });

  const response = await requestSupabase(`blocks?${query.toString()}`, {
    method: "GET",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);

  const rows = (await response.json()) as Array<{ user_id: string }>;
  return rows.length > 0;
}

/**
 * ブロック一覧を取得する（設定画面用）。
 * Service Roleを使用。listFollowers のパターンを踏襲。
 * 1. Service Roleで blocks テーブルから blocked_id リストを取得
 * 2. getUserProfilesBatch でプロフィール一括解決
 */
export async function listBlockedUsers(params: {
  userId: string;
}): Promise<UserProfile[]> {
  const query = new URLSearchParams({
    select: "blocked_id",
    user_id: `eq.${params.userId}`,
    order: "created_at.desc",
  });

  const response = await requestSupabaseWithServiceRole(
    `blocks?${query.toString()}`,
  );
  await ensureResponseOk(response);

  const rows = (await response.json()) as Array<{ blocked_id: string }>;
  const userIds = rows.map((row) => row.blocked_id);
  return getUserProfilesBatch(userIds);
}

/**
 * 関係性一括取得（プロフィール画面用）。
 * isFollowing, isMuted, isBlocked, isBlockedBy を並列で取得する。
 */
export async function getRelationship(params: {
  viewerId: string;
  targetUserId: string;
  accessToken: string;
}): Promise<UserRelationship> {
  const targetUserIds = [params.targetUserId] as const;

  const [followingIds, mutedIds, blockedIds, blockedByResult] =
    await Promise.all([
      getFollowingUserIds({
        followerId: params.viewerId,
        targetUserIds,
        accessToken: params.accessToken,
      }),
      getMutedUserIds({
        userId: params.viewerId,
        targetUserIds,
        accessToken: params.accessToken,
      }),
      getBlockedUserIds({
        userId: params.viewerId,
        targetUserIds,
        accessToken: params.accessToken,
      }),
      isBlockedBy({
        userId: params.viewerId,
        blockedById: params.targetUserId,
        accessToken: params.accessToken,
      }),
    ]);

  return {
    isFollowing: followingIds.has(params.targetUserId),
    isMuted: mutedIds.has(params.targetUserId),
    isBlocked: blockedIds.has(params.targetUserId),
    isBlockedBy: blockedByResult,
  };
}
