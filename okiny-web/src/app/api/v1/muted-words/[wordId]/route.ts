import { NextResponse } from "next/server";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import { removeMutedWord } from "@/lib/supabase-rest-muted-words";

/**
 * DELETE /api/v1/muted-words/:wordId
 *
 * ミュートワードを削除する（認証必須）。
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ wordId: string }> },
) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }

  const { wordId } = await params;

  if (!wordId) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: "wordId が必要です。",
        },
      },
      { status: 422 },
    );
  }

  try {
    await removeMutedWord({
      userId: auth.userId,
      wordId,
      accessToken: auth.accessToken,
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/v1/muted-words/:wordId] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[DELETE /api/v1/muted-words/:wordId] detail:", error);
    }
    return NextResponse.json(
      {
        error: {
          code: "SERVER",
          message: "ミュートワードの削除に失敗しました。",
        },
      },
      { status: 500 },
    );
  }
}
