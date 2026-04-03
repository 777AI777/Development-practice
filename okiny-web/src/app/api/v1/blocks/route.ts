import { NextResponse } from "next/server";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import { listBlockedUsers } from "@/lib/supabase-rest";

/**
 * GET /api/v1/blocks
 *
 * ブロック一覧を取得する（認証必須・設定画面用）。
 */
export async function GET() {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }

  try {
    const blockedUsers = await listBlockedUsers({ userId: auth.userId });
    return NextResponse.json({ data: blockedUsers });
  } catch (error) {
    console.error("[GET /api/v1/blocks] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/v1/blocks] detail:", error);
    }
    return NextResponse.json(
      {
        error: {
          code: "SERVER",
          message: "ブロック一覧の取得に失敗しました。",
        },
      },
      { status: 500 },
    );
  }
}
