import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import { removeFollower } from "@/lib/supabase-rest";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const paramsSchema = z.object({
  followerId: z
    .string()
    .regex(UUID_PATTERN, "フォロワーIDはUUID形式で指定してください。"),
});

/**
 * DELETE /api/v1/followers/:followerId
 *
 * 自分のフォロワーから指定ユーザーを削除する（認証必須）。
 * 既に削除済みの場合も冪等に成功を返す。
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ followerId: string }> },
) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }

  const { followerId } = await params;

  const parsedParams = paramsSchema.safeParse({ followerId });
  if (!parsedParams.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message:
            parsedParams.error.issues[0]?.message ?? "Invalid follower ID.",
        },
      },
      { status: 422 },
    );
  }

  if (followerId === auth.userId) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: "自分自身をフォロワーから削除することはできません。",
        },
      },
      { status: 422 },
    );
  }

  try {
    await removeFollower({
      ownUserId: auth.userId,
      followerId,
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/v1/followers/:followerId] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[DELETE /api/v1/followers/:followerId] detail:", error);
    }
    return NextResponse.json(
      {
        error: {
          code: "SERVER",
          message: "フォロワーの削除に失敗しました。",
        },
      },
      { status: 500 },
    );
  }
}
