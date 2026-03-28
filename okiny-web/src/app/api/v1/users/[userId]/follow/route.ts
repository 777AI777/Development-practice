import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import { addFollow, removeFollow } from "@/lib/supabase-rest";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const paramsSchema = z.object({
  userId: z.string().regex(UUID_PATTERN, "ユーザーIDはUUID形式で指定してください。"),
});

/**
 * POST /api/v1/users/:userId/follow
 *
 * 指定ユーザーをフォローする（認証必須）。
 * 既にフォロー済みの場合は冪等に成功を返す。
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }

  const { userId: targetUserId } = await params;

  const parsedParams = paramsSchema.safeParse({ userId: targetUserId });
  if (!parsedParams.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: parsedParams.error.issues[0]?.message ?? "Invalid user ID.",
        },
      },
      { status: 422 },
    );
  }

  // 自己フォローチェック
  if (targetUserId === auth.userId) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: "自分自身をフォローすることはできません。",
        },
      },
      { status: 422 },
    );
  }

  try {
    await addFollow({
      followerId: auth.userId,
      followingId: targetUserId,
      accessToken: auth.accessToken,
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[POST /api/v1/users/:userId/follow] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[POST /api/v1/users/:userId/follow] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "フォローに失敗しました。" } },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/users/:userId/follow
 *
 * 指定ユーザーのフォローを解除する（認証必須）。
 * 既にフォロー解除済みの場合も冪等に成功を返す。
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }

  const { userId: targetUserId } = await params;

  const parsedParams = paramsSchema.safeParse({ userId: targetUserId });
  if (!parsedParams.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: parsedParams.error.issues[0]?.message ?? "Invalid user ID.",
        },
      },
      { status: 422 },
    );
  }

  try {
    await removeFollow({
      followerId: auth.userId,
      followingId: targetUserId,
      accessToken: auth.accessToken,
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/v1/users/:userId/follow] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[DELETE /api/v1/users/:userId/follow] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "フォロー解除に失敗しました。" } },
      { status: 500 },
    );
  }
}
