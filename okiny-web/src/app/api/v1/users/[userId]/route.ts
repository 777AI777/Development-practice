import { NextResponse } from "next/server";
import { z } from "zod";

import { getUserProfile, listPublicRankingsByUser } from "@/lib/supabase-rest";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const paramsSchema = z.object({
  userId: z.string().regex(UUID_PATTERN, "ユーザーIDはUUID形式で指定してください。"),
});

/**
 * GET /api/v1/users/:userId
 *
 * ユーザープロフィールと公開ランキング一覧を取得する（認証不要）。
 * - プロフィール: service_role_key で user_profiles VIEW から取得
 * - 公開ランキング: anon key + is_public=true フィルタで取得
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
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

  try {
    // プロフィールと公開ランキングを並列取得
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
      return NextResponse.json(
        { error: { code: "SERVER", message: "サーバー設定エラーです。" } },
        { status: 500 },
      );
    }

    const [profile, rankings] = await Promise.all([
      getUserProfile(userId),
      listPublicRankingsByUser({ userId, accessToken: anonKey }),
    ]);

    if (!profile) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "ユーザーが見つかりません。" } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: {
        profile,
        rankings,
      },
    });
  } catch (error) {
    console.error("[GET /api/v1/users/:userId] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/v1/users/:userId] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "ユーザー情報の取得に失敗しました。" } },
      { status: 500 },
    );
  }
}
