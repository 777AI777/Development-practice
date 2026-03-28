import { NextResponse } from "next/server";
import { z } from "zod";

import {
  authErrorResponse,
  getAuthenticatedUserId,
} from "@/lib/supabase/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { incrementImpressionCount } from "@/lib/supabase-rest";

const bodySchema = z.object({
  rankingIds: z
    .array(z.string().uuid("rankingIds は UUID 形式で指定してください。"))
    .min(1, "rankingIds は 1 件以上必要です。")
    .max(50, "rankingIds は 50 件以下にしてください。"),
});

const IMPRESSION_CACHE = new Map<string, number>();
const IMPRESSION_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_IMPRESSION_CACHE_SIZE = 10_000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function cleanExpiredImpressionEntries() {
  const now = Date.now();
  for (const [key, timestamp] of IMPRESSION_CACHE) {
    if (now - timestamp > IMPRESSION_TTL_MS) {
      IMPRESSION_CACHE.delete(key);
    }
  }
}

let lastCleanup = Date.now();

export function _resetForTesting() {
  IMPRESSION_CACHE.clear();
  lastCleanup = Date.now();
}

export const _testInternals = {
  IMPRESSION_CACHE,
  MAX_IMPRESSION_CACHE_SIZE,
} as const;

export async function POST(request: Request) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }

  const { userId, accessToken } = auth;

  try {
    const rateResult = await checkRateLimit(`impressions:${userId}`);
    if (!rateResult.success) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMIT",
            message: "リクエスト数が上限を超えました。しばらく待ってから再度お試しください。",
          },
        },
        { status: 429 },
      );
    }
  } catch (error) {
    console.error("[POST /api/v1/rankings/impressions] rate limit check failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[POST /api/v1/rankings/impressions] rate limit detail:", error);
    }

    return NextResponse.json(
      {
        error: {
          code: "SERVER",
          message: "一時的にアクセス制御を確認できませんでした。しばらくしてからもう一度お試しください。",
        },
      },
      { status: 500 },
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

  const now = Date.now();

  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    cleanExpiredImpressionEntries();
    lastCleanup = now;
  }

  const uncachedIds = parsed.data.rankingIds.filter((rankingId) => {
    const cacheKey = `${rankingId}:${userId}`;
    const lastRecorded = IMPRESSION_CACHE.get(cacheKey);
    return !lastRecorded || now - lastRecorded >= IMPRESSION_TTL_MS;
  });

  if (uncachedIds.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    await incrementImpressionCount({
      rankingIds: uncachedIds,
      accessToken,
    });

    for (const rankingId of uncachedIds) {
      IMPRESSION_CACHE.set(`${rankingId}:${userId}`, now);
    }

    while (IMPRESSION_CACHE.size > MAX_IMPRESSION_CACHE_SIZE) {
      const oldestKey = IMPRESSION_CACHE.keys().next().value;
      if (!oldestKey) {
        break;
      }
      IMPRESSION_CACHE.delete(oldestKey);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[POST /api/v1/rankings/impressions] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[POST /api/v1/rankings/impressions] detail:", error);
    }

    return NextResponse.json(
      {
        error: {
          code: "SERVER",
          message: "インプレッションの記録に失敗しました。",
        },
      },
      { status: 500 },
    );
  }
}
