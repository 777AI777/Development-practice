import type {
  PublicRankingWithAuthor,
  PublicRankingWithAuthorAndComment,
  RankingComment,
  SupabaseCommentRow,
} from "@/lib/types";
import { requestSupabase, ensureResponseOk, toPostgrestInList } from "@/lib/supabase-rest";

// ---------------------------------------------------------------------------
// ランキングコメント
// ---------------------------------------------------------------------------

function mapCommentRow(row: SupabaseCommentRow): RankingComment {
  return {
    id: row.id,
    rankingId: row.ranking_id,
    userId: row.user_id,
    comment: row.comment,
    createdAt: row.created_at,
  };
}

/**
 * ランキングにコメントを追加する。
 */
export async function createRankingComment(params: {
  rankingId: string;
  userId: string;
  comment: string;
  accessToken: string;
}): Promise<RankingComment> {
  const response = await requestSupabase("ranking_comments", {
    method: "POST",
    prefer: "return=representation",
    accessToken: params.accessToken,
    body: [{
      ranking_id: params.rankingId,
      user_id: params.userId,
      comment: params.comment,
    }],
  });
  await ensureResponseOk(response);
  const rows = (await response.json()) as SupabaseCommentRow[];
  const created = rows[0];
  if (!created) {
    throw new Error("Comment creation did not return a row");
  }
  return mapCommentRow(created);
}

/**
 * 特定のコメントを削除する（自分のコメントのみ）。
 */
export async function deleteRankingComment(params: {
  rankingId: string;
  commentId: string;
  userId: string;
  accessToken: string;
}): Promise<void> {
  const query = new URLSearchParams({
    id: `eq.${params.commentId}`,
    ranking_id: `eq.${params.rankingId}`,
    user_id: `eq.${params.userId}`,
  });
  const response = await requestSupabase(`ranking_comments?${query.toString()}`, {
    method: "DELETE",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);
}

/**
 * 複数のランキングIDから各ランキングの最新コメント1件を取得する。
 * 一覧表示でのプレビュー用。
 */
export async function getLatestCommentsForRankings(params: {
  rankingIds: string[];
  accessToken: string;
}): Promise<Map<string, RankingComment>> {
  if (params.rankingIds.length === 0) return new Map();

  const inList = toPostgrestInList(params.rankingIds);
  const query = new URLSearchParams({
    select: "id,ranking_id,user_id,comment,created_at",
    order: "created_at.desc",
  });
  query.set("ranking_id", `in.${inList}`);
  query.set("limit", String(params.rankingIds.length * 3));

  const response = await requestSupabase(`ranking_comments?${query.toString()}`, {
    method: "GET",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);
  const rows = (await response.json()) as SupabaseCommentRow[];

  const result = new Map<string, RankingComment>();
  for (const row of rows) {
    if (!result.has(row.ranking_id)) {
      result.set(row.ranking_id, mapCommentRow(row));
    }
  }
  return result;
}

/**
 * 複数ランキングIDから各ランキングの投稿者（userId）が書いた最初のコメントを取得する。
 * 投稿本文コメント表示用（投稿時に添付したコメント）。
 */
async function getAuthorCommentsForRankings(params: {
  rankings: ReadonlyArray<{ id: string; userId: string }>;
  accessToken: string;
}): Promise<Map<string, string>> {
  if (params.rankings.length === 0) return new Map();

  const rankingIds = params.rankings.map((r) => r.id);
  const inList = toPostgrestInList(rankingIds);
  // 古い順で取得し、各ランキングの最初のコメントを投稿者コメントとして扱う
  const query = new URLSearchParams({
    select: "id,ranking_id,user_id,comment,created_at",
    order: "created_at.asc",
  });
  query.set("ranking_id", `in.${inList}`);
  query.set("limit", String(params.rankings.length * 3));

  const response = await requestSupabase(`ranking_comments?${query.toString()}`, {
    method: "GET",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);
  const rows = (await response.json()) as SupabaseCommentRow[];

  // rankingId → userId のマップ（投稿者確認用）
  const authorByRanking = new Map(params.rankings.map((r) => [r.id, r.userId]));

  const result = new Map<string, string>();
  for (const row of rows) {
    if (result.has(row.ranking_id)) continue;
    const authorUserId = authorByRanking.get(row.ranking_id);
    if (authorUserId === row.user_id) {
      result.set(row.ranking_id, row.comment);
    }
  }
  return result;
}

/**
 * 1つのランキングの最新コメント1件を取得する。
 */
export async function getLatestCommentForRanking(params: {
  rankingId: string;
  accessToken: string;
}): Promise<RankingComment | null> {
  const query = new URLSearchParams({
    select: "id,ranking_id,user_id,comment,created_at",
    ranking_id: `eq.${params.rankingId}`,
    order: "created_at.desc",
    limit: "1",
  });

  const response = await requestSupabase(`ranking_comments?${query.toString()}`, {
    method: "GET",
    accessToken: params.accessToken,
  });
  await ensureResponseOk(response);
  const rows = (await response.json()) as SupabaseCommentRow[];
  const row = rows[0];
  return row ? mapCommentRow(row) : null;
}

/**
 * ランキング一覧に最新コメントと投稿者コメントを付与する。
 * コメントが無いランキングには latestComment: null を設定。
 * 投稿者が投稿時に書いたコメントは ranking.comment にセットする。
 */
export async function attachCommentsToRankings(
  rankings: PublicRankingWithAuthor[],
  accessToken: string,
): Promise<PublicRankingWithAuthorAndComment[]> {
  if (rankings.length === 0) return [];
  const rankingIds = rankings.map((r) => r.id);
  const [commentsMap, authorCommentsMap] = await Promise.all([
    getLatestCommentsForRankings({ rankingIds, accessToken }),
    getAuthorCommentsForRankings({ rankings, accessToken }),
  ]);
  return rankings.map((ranking) => ({
    ...ranking,
    comment: authorCommentsMap.get(ranking.id) ?? ranking.comment,
    latestComment: commentsMap.get(ranking.id) ?? null,
  }));
}
