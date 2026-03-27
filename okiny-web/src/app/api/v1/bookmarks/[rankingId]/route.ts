import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import { addBookmark, removeBookmark } from "@/lib/supabase-rest";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const paramsSchema = z.object({
  rankingId: z.string().regex(UUID_PATTERN, "ランキングIDはUUID形式で指定してください。"),
});

/**
 * POST /api/v1/bookmarks/:rankingId
 *
 * ブックマークを追加する（認証必須）。
 * 既にブックマーク済みの場合は冪等に成功を返す。
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ rankingId: string }> },
) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }
  const { userId, accessToken } = auth;

  const { rankingId } = await params;

  const parsedParams = paramsSchema.safeParse({ rankingId });
  if (!parsedParams.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: parsedParams.error.issues[0]?.message ?? "Invalid ranking ID.",
        },
      },
      { status: 422 },
    );
  }

  try {
    await addBookmark({ userId, rankingId, accessToken });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[POST /api/v1/bookmarks/:rankingId] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[POST /api/v1/bookmarks/:rankingId] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "ブックマークの追加に失敗しました。" } },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/bookmarks/:rankingId
 *
 * ブックマークを削除する（認証必須）。
 * 既に削除済みの場合も冪等に成功を返す。
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ rankingId: string }> },
) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }
  const { userId, accessToken } = auth;

  const { rankingId } = await params;

  const parsedParams = paramsSchema.safeParse({ rankingId });
  if (!parsedParams.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: parsedParams.error.issues[0]?.message ?? "Invalid ranking ID.",
        },
      },
      { status: 422 },
    );
  }

  try {
    await removeBookmark({ userId, rankingId, accessToken });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/v1/bookmarks/:rankingId] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[DELETE /api/v1/bookmarks/:rankingId] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "ブックマークの削除に失敗しました。" } },
      { status: 500 },
    );
  }
}
