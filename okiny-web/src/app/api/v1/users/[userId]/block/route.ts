import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import { addBlock, removeBlock } from "@/lib/supabase-rest";
import { removeFollow, removeFollower } from "@/lib/supabase-rest-follows";
import { removeMute } from "@/lib/supabase-rest-mutes";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const paramsSchema = z.object({
  userId: z.string().regex(
    UUID_PATTERN,
    "ユーザーIDはUUID形式で指定してください。",
  ),
});

/**
 * POST /api/v1/users/:userId/block
 *
 * 指定ユーザーをブロックする（認証必須）。
 * 既にブロック済みの場合は冪等に成功を返す。
 *
 * 副作用（ブロック自体の成功には影響しない）:
 * - 双方向のフォロー解除
 * - ミュートがあれば削除（ブロックの方が強い）
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
          message:
            parsedParams.error.issues[0]?.message ?? "Invalid user ID.",
        },
      },
      { status: 422 },
    );
  }

  // 自己ブロックチェック
  if (targetUserId === auth.userId) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: "自分自身をブロックすることはできません。",
        },
      },
      { status: 422 },
    );
  }

  try {
    await addBlock({
      userId: auth.userId,
      blockedId: targetUserId,
      accessToken: auth.accessToken,
    });
  } catch (error) {
    console.error("[POST /api/v1/users/:userId/block] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[POST /api/v1/users/:userId/block] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "ブロックに失敗しました。" } },
      { status: 500 },
    );
  }

  // 副作用: フォロー解除・ミュート削除（失敗してもブロック自体は成功）
  try {
    await Promise.all([
      // 自分→相手のフォロー解除
      removeFollow({
        followerId: auth.userId,
        followingId: targetUserId,
        accessToken: auth.accessToken,
      }),
      // 相手→自分のフォロー解除（Service Role必要）
      removeFollower({
        ownUserId: auth.userId,
        followerId: targetUserId,
      }),
      // ミュートがあれば削除（ブロックの方が強い）
      removeMute({
        userId: auth.userId,
        mutedId: targetUserId,
        accessToken: auth.accessToken,
      }),
    ]);
  } catch (sideEffectError) {
    console.error(
      "[POST /api/v1/users/:userId/block] side-effect cleanup failed",
    );
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "[POST /api/v1/users/:userId/block] side-effect detail:",
        sideEffectError,
      );
    }
  }

  return new NextResponse(null, { status: 204 });
}

/**
 * DELETE /api/v1/users/:userId/block
 *
 * 指定ユーザーのブロックを解除する（認証必須）。
 * 既にブロック解除済みの場合も冪等に成功を返す。
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
          message:
            parsedParams.error.issues[0]?.message ?? "Invalid user ID.",
        },
      },
      { status: 422 },
    );
  }

  try {
    await removeBlock({
      userId: auth.userId,
      blockedId: targetUserId,
      accessToken: auth.accessToken,
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/v1/users/:userId/block] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[DELETE /api/v1/users/:userId/block] detail:", error);
    }
    return NextResponse.json(
      {
        error: {
          code: "SERVER",
          message: "ブロック解除に失敗しました。",
        },
      },
      { status: 500 },
    );
  }
}
