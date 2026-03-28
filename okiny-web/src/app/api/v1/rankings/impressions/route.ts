import { NextResponse } from "next/server";
import { z } from "zod";

import {
  authErrorResponse,
  getAuthenticatedUserId,
} from "@/lib/supabase/auth-guard";
import { incrementImpressionCount } from "@/lib/supabase-rest";
import { checkRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  rankingIds: z
    .array(z.string().uuid("各IDはUUID形式で指定してください。"))
    .min(1, "rankingIdsは1件以上必要です。")
    .max(50, "rankingIdsは50件以下にしてください。"),
});

export async function POST(request: Request) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }
  const { userId, accessToken } = auth;

  // レート制限
  const rateResult = await checkRateLimit(`impressions:${userId}`);
  if (rateResult && !rateResult.success) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT", message: "リクエスト数が上限を超えました。" } },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "Invalid JSON payload." } },
      { status: 422 },
    );
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: parsed.error.issues[0]?.message ?? "Invalid input.",
        },
      },
      { status: 422 },
    );
  }

  try {
    await incrementImpressionCount({
      rankingIds: parsed.data.rankingIds,
      accessToken,
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[POST /api/v1/rankings/impressions] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[POST /api/v1/rankings/impressions] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "インプレッションの記録に失敗しました。" } },
      { status: 500 },
    );
  }
}
