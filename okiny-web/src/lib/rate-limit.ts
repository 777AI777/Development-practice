import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/** APIリクエスト数の上限（ウィンドウあたり） */
const RATE_LIMIT_MAX_REQUESTS = 30;
/** レート制限のウィンドウ期間 */
const RATE_LIMIT_WINDOW = "1 m";

function createRateLimiter(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL または UPSTASH_REDIS_REST_TOKEN が未設定です。本番環境ではレート制限が無効になっています。",
      );
    }
    return null;
  }

  const redis = new Redis({ url, token });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW),
    analytics: true,
    prefix: "okiny:ratelimit",
  });
}

const rateLimiter = createRateLimiter();

export async function checkRateLimit(identifier: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} | null> {
  if (!rateLimiter) return null;

  try {
    return await rateLimiter.limit(identifier);
  } catch {
    return null;
  }
}
