import { NextResponse } from "next/server";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import { listMutedUsers } from "@/lib/supabase-rest";

/**
 * GET /api/v1/mutes
 *
 * ミュート一覧を取得する（認証必須）。
 * 設定画面でミュート中ユーザーの一覧を表示するために使用。
 */
export async function GET() {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }

  try {
    const users = await listMutedUsers({ userId: auth.userId });
    return NextResponse.json({ data: users });
  } catch (error) {
    console.error("[GET /api/v1/mutes] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/v1/mutes] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "ミュート一覧の取得に失敗しました。" } },
      { status: 500 },
    );
  }
}
