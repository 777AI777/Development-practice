import type { UserProfile } from "@/lib/types";
import {
  requestSupabase,
  requestSupabaseWithServiceRole,
  ensureResponseOk,
  toPostgrestInList,
  getUserProfilesBatch,
} from "./supabase-rest";

/**
 * ミュートを追加する（冪等 — 409 Conflict は握りつぶす）。
 * パターン: addFollow と同じ。
 */
export async function addMute(params: {
  userId: string;
  mutedId: string;
  accessToken: string;
}): Promise<void> {
  const response = await requestSupabase("mutes", {
    method: "POST",
    accessToken: params.accessToken,
    prefer: "return=minimal",
    body: [{ user_id: params.userId, muted_id: params.mutedId }],
  });
  // 409 Conflict（既にミュート済み）は正常として扱う
  if (response.status === 409) {
    return;
  }
  await ensureResponseOk(response);
}

/**
 * ミュートを解除する（冪等）。
 * パターン: removeFollow と同じ。
 */
export async function removeMute(params: {
  userId: string;
  mutedId: string;
  accessToken: string;
}): Promise<void> {
  const query = new URLSearchParams({
    user_id: `eq.${params.userId}`,
    muted_id: `eq.${params.mutedId}`,
  });
  const response = await requestSupabase(`mutes?${query.toString()}`, {
    method: "DELETE",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);
}

/**
 * 指定ユーザーIDリストのうちミュート済みのIDを Set で返す。
 * パターン: getFollowingUserIds と同じ。
 */
export async function getMutedUserIds(params: {
  userId: string;
  targetUserIds: readonly string[];
  accessToken: string;
}): Promise<Set<string>> {
  if (params.targetUserIds.length === 0) {
    return new Set();
  }

  const query = new URLSearchParams({
    select: "muted_id",
    user_id: `eq.${params.userId}`,
  });
  query.set("muted_id", `in.${toPostgrestInList(params.targetUserIds)}`);

  const response = await requestSupabase(`mutes?${query.toString()}`, {
    method: "GET",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);

  const rows = (await response.json()) as Array<{ muted_id: string }>;
  return new Set(rows.map((row) => row.muted_id));
}

/**
 * ミュート一覧を UserProfile[] で返す（設定画面用）。
 * mutes テーブルから muted_id を取得 → getUserProfilesBatch で解決。
 * パターン: listFollowers / listFollowing と同じ。
 */
export async function listMutedUsers(params: {
  userId: string;
}): Promise<UserProfile[]> {
  const query = new URLSearchParams({
    select: "muted_id",
    user_id: `eq.${params.userId}`,
    order: "created_at.desc",
  });

  const response = await requestSupabaseWithServiceRole(
    `mutes?${query.toString()}`,
  );
  await ensureResponseOk(response);

  const rows = (await response.json()) as Array<{ muted_id: string }>;
  const userIds = rows.map((row) => row.muted_id);
  return getUserProfilesBatch(userIds);
}
