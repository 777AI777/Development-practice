import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import { getRelationship } from "@/lib/supabase-rest";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const paramsSchema = z.object({
  userId: z.string().regex(
    UUID_PATTERN,
    "ユーザーIDはUUID形式で指定してください。",
  ),
});

/**
 * GET /api/v1/users/:userId/relationship
 *
 * 指定ユーザーとの関係性を一括取得する（認証必須）。
 * isFollowing, isMuted, isBlocked, isBlockedBy を返す。
 */
export async function GET(
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
    const relationship = await getRelationship({
      viewerId: auth.userId,
      targetUserId,
      accessToken: auth.accessToken,
    });
    return NextResponse.json({ data: relationship });
  } catch (error) {
    console.error("[GET /api/v1/users/:userId/relationship] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "[GET /api/v1/users/:userId/relationship] detail:",
        error,
      );
    }
    return NextResponse.json(
      {
        error: {
          code: "SERVER",
          message: "関係性の取得に失敗しました。",
        },
      },
      { status: 500 },
    );
  }
}
