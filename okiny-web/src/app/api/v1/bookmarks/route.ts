import { NextResponse } from "next/server";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import { listBookmarkedRankings } from "@/lib/supabase-rest";

/**
 * GET /api/v1/bookmarks
 *
 * ユーザーのブックマーク一覧を取得する（認証必須）。
 * ブックマーク済みランキングのフルデータを返す。
 */
export async function GET() {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }
  const { userId, accessToken } = auth;

  try {
    const data = await listBookmarkedRankings({ userId, accessToken });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/v1/bookmarks] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/v1/bookmarks] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "ブックマーク一覧の取得に失敗しました。" } },
      { status: 500 },
    );
  }
}
