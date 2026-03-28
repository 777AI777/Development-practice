import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { listFollowingRankings } from "@/lib/supabase-rest";
import { decodeSearchCursor } from "@/lib/search-mappers";
import { FOLLOWING_FEED_LIMIT } from "@/lib/constants";

const FOLLOWING_RATE_LIMIT = 30;

const queryParamsSchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(FOLLOWING_FEED_LIMIT),
  cursor: z.string().optional(),
});

/**
 * GET /api/v1/rankings/following
 *
 * フォローユーザーの公開ランキング一覧を取得する（認証必須・カーソルページネーション）。
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }

  const rateLimitResult = await checkRateLimit(
    `following:${auth.userId}`,
    FOLLOWING_RATE_LIMIT,
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
  const cursor = cursorStr ? decodeSearchCursor(cursorStr) : null;

  try {
    const result = await listFollowingRankings({
      viewerUserId: auth.userId,
      accessToken: auth.accessToken,
      limit,
      cursor,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[GET /api/v1/rankings/following] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/v1/rankings/following] detail:", error);
    }
    return NextResponse.json(
      {
        error: {
          code: "SERVER",
          message: "フォローランキングの取得に失敗しました。",
        },
      },
      { status: 500 },
    );
  }
}
