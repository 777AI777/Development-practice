import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getUserOwnTagIds,
  getBookmarkedTagIds,
  getAffinityTagIds,
  getSimilarTagIds,
  listRecommendRankings,
} from "@/lib/supabase-rest-recommend";
import { getMutedWordStrings } from "@/lib/supabase-rest-muted-words";
import { filterByMutedWords } from "@/lib/muted-word-filter";
import { decodeRecommendCursor } from "@/lib/search-mappers";
import {
  RECOMMEND_FEED_LIMIT,
  RECOMMEND_TAG_SIMILARITY_THRESHOLD,
  RECOMMEND_AFFINITY_HIGH_THRESHOLD,
  RECOMMEND_AFFINITY_LOW_THRESHOLD,
} from "@/lib/constants";

const RECOMMEND_RATE_LIMIT = 30;

const queryParamsSchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(RECOMMEND_FEED_LIMIT),
  cursor: z.string().optional(),
});

/**
 * GET /api/v1/rankings/recommend
 *
 * おすすめランキング一覧を取得する（認証必須・カーソルページネーション）。
 * ユーザーの行動（自作タグ・ブックマーク・アフィニティ）をもとにtierを組み立て、
 * RPC list_recommend_rankings に委譲する。
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }

  const rateLimitResult = await checkRateLimit(
    `recommend:${auth.userId}`,
    RECOMMEND_RATE_LIMIT,
  );
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message:
            "リクエスト数が上限を超えました。しばらく待ってから再度お試しください。",
        },
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rateLimitResult.limit),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": String(rateLimitResult.reset),
        },
      },
    );
  }

  const url = new URL(request.url);
  const parsed = queryParamsSchema.safeParse({
    limit: url.searchParams.get("limit") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: parsed.error.issues[0]?.message ?? "入力が不正です",
        },
      },
      { status: 422 },
    );
  }

  const { limit, cursor: cursorStr } = parsed.data;
  const cursor = cursorStr ? decodeRecommendCursor(cursorStr) : null;

  try {
    // ユーザーの行動データ + ミュートワードを並列取得
    const [ownTagIds, bookmarkedTagIds, affinityTagIds, mutedWords] =
      await Promise.all([
        getUserOwnTagIds({
          userId: auth.userId,
          accessToken: auth.accessToken,
        }),
        getBookmarkedTagIds({
          userId: auth.userId,
          accessToken: auth.accessToken,
        }),
        getAffinityTagIds({
          userId: auth.userId,
          accessToken: auth.accessToken,
          highThreshold: RECOMMEND_AFFINITY_HIGH_THRESHOLD,
          lowThreshold: RECOMMEND_AFFINITY_LOW_THRESHOLD,
        }),
        getMutedWordStrings({
          userId: auth.userId,
          accessToken: auth.accessToken,
        }),
      ]);

    // tier3 = 自作タグ（最優先）
    const tier3TagIds = ownTagIds;

    // tier2 = ブックマーク由来タグ + 高アフィニティタグ（重複排除）
    const tier2Set = new Set([
      ...bookmarkedTagIds,
      ...affinityTagIds.high,
    ]);
    // tier3に含まれるものを除外
    for (const id of tier3TagIds) {
      tier2Set.delete(id);
    }
    const tier2TagIds = [...tier2Set];

    // tier2用の類似タグを取得
    const allHighTierTagIds = [...tier3TagIds, ...tier2TagIds];
    const similarTagIds = await getSimilarTagIds({
      tagIds: allHighTierTagIds,
      minScore: RECOMMEND_TAG_SIMILARITY_THRESHOLD,
      accessToken: auth.accessToken,
    });

    // tier1 = 低アフィニティタグ + 類似タグから tier3/tier2 を除外したもの
    const excludedFromTier1 = new Set([...tier3TagIds, ...tier2TagIds]);
    const tier1Set = new Set([
      ...affinityTagIds.low,
      ...similarTagIds,
    ]);
    for (const id of excludedFromTier1) {
      tier1Set.delete(id);
    }
    const tier1TagIds = [...tier1Set];

    const result = await listRecommendRankings({
      viewerUserId: auth.userId,
      accessToken: auth.accessToken,
      limit,
      tier3TagIds,
      tier2TagIds,
      tier1TagIds,
      cursor,
    });

    const filteredItems = filterByMutedWords(result.items, mutedWords);
    const filteredResult = { ...result, items: filteredItems };

    return NextResponse.json({ data: filteredResult });
  } catch (error) {
    console.error("[GET /api/v1/rankings/recommend] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/v1/rankings/recommend] detail:", error);
    }
    return NextResponse.json(
      {
        error: {
          code: "SERVER",
          message: "おすすめランキングの取得に失敗しました。",
        },
      },
      { status: 500 },
    );
  }
}
