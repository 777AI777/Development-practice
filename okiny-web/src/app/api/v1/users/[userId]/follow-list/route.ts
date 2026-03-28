import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import { listFollowers, listFollowing } from "@/lib/supabase-rest";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const paramsSchema = z.object({
  userId: z.string().regex(UUID_PATTERN, "ユーザーIDはUUID形式で指定してください。"),
});

const querySchema = z.object({
  type: z.enum(["followers", "following"], {
    message: "type は 'followers' または 'following' で指定してください。",
  }),
});

/**
 * GET /api/v1/users/:userId/follow-list?type=followers|following
 *
 * 指定ユーザーのフォロワー一覧またはフォロー一覧を取得する（認証必須）。
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }

  const { userId } = await params;

  const parsedParams = paramsSchema.safeParse({ userId });
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

  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "";

  const parsedQuery = querySchema.safeParse({ type });
  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: parsedQuery.error.issues[0]?.message ?? "Invalid type parameter.",
        },
      },
      { status: 422 },
    );
  }

  try {
    const users =
      parsedQuery.data.type === "followers"
        ? await listFollowers({ userId })
        : await listFollowing({ userId });

    return NextResponse.json({ data: { users } });
  } catch (error) {
    console.error("[GET /api/v1/users/:userId/follow-list] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/v1/users/:userId/follow-list] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "フォロー一覧の取得に失敗しました。" } },
      { status: 500 },
    );
  }
}
