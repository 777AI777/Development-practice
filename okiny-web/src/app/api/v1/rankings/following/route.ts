import { NextResponse } from "next/server";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import { listFollowingRankings } from "@/lib/supabase-rest";

/**
 * GET /api/v1/rankings/following
 *
 * フォロー中ユーザーの公開ランキング一覧を取得する（認証必須）。
 */
export async function GET() {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }

  try {
    const rankings = await listFollowingRankings({
      viewerUserId: auth.userId,
      accessToken: auth.accessToken,
    });

    return NextResponse.json({ data: rankings });
  } catch (error) {
    console.error("[GET /api/v1/rankings/following] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/v1/rankings/following] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "フォロー中ランキングの取得に失敗しました。" } },
      { status: 500 },
    );
  }
}
