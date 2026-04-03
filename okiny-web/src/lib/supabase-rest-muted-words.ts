import {
  requestSupabase,
  ensureResponseOk,
} from "./supabase-rest";
import type { MutedWord } from "@/lib/types";

/**
 * ミュートワードを追加する（冪等 — 409 Conflict は握りつぶす）。
 * パターン: addMute と同じ。
 */
export async function addMutedWord(params: {
  userId: string;
  word: string;
  accessToken: string;
}): Promise<void> {
  const response = await requestSupabase("muted_words", {
    method: "POST",
    accessToken: params.accessToken,
    prefer: "return=minimal",
    body: [{ user_id: params.userId, word: params.word }],
  });
  // 409 Conflict（既に同じワードが登録済み）は正常として扱う
  if (response.status === 409) {
    return;
  }
  await ensureResponseOk(response);
}

/**
 * ミュートワードを削除する。
 */
export async function removeMutedWord(params: {
  userId: string;
  wordId: string;
  accessToken: string;
}): Promise<void> {
  const query = new URLSearchParams({
    id: `eq.${params.wordId}`,
    user_id: `eq.${params.userId}`,
  });
  const response = await requestSupabase(`muted_words?${query.toString()}`, {
    method: "DELETE",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);
}

/**
 * ミュートワード一覧を取得する（設定画面用）。
 */
export async function listMutedWords(params: {
  userId: string;
  accessToken: string;
}): Promise<MutedWord[]> {
  const query = new URLSearchParams({
    select: "id,word,created_at",
    user_id: `eq.${params.userId}`,
    order: "created_at.desc",
  });
  const response = await requestSupabase(`muted_words?${query.toString()}`, {
    method: "GET",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);

  const rows = (await response.json()) as Array<{
    id: string;
    word: string;
    created_at: string;
  }>;
  return rows.map((row) => ({
    id: row.id,
    word: row.word,
    createdAt: row.created_at,
  }));
}

/**
 * フィード用: ミュートワード文字列のみを取得する（フィルタリング用、軽量）。
 */
export async function getMutedWordStrings(params: {
  userId: string;
  accessToken: string;
}): Promise<string[]> {
  const query = new URLSearchParams({
    select: "word",
    user_id: `eq.${params.userId}`,
  });
  const response = await requestSupabase(`muted_words?${query.toString()}`, {
    method: "GET",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);

  const rows = (await response.json()) as Array<{ word: string }>;
  return rows.map((row) => row.word);
}
