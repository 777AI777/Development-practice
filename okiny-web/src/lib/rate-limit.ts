import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/** 認証済みユーザー（Cookie ベース）のデフォルト上限 */
export const RATE_LIMIT_AUTHENTICATED = 120;

/** 未認証ユーザー（IP ベース）のデフォルト上限 */
export const RATE_LIMIT_UNAUTHENTICATED = 30;

const RATE_LIMIT_WINDOW = "1 m";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

let redisInstance: Redis | null = null;
const limiters = new Map<number, Ratelimit>();

function getRequiredEnv(name: "UPSTASH_REDIS_REST_URL" | "UPSTASH_REDIS_REST_TOKEN"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[rate-limit] ${name} is not configured.`);
  }

  return value;
}

function getRedis(): Redis {
  if (redisInstance) {
    return redisInstance;
  }

  redisInstance = new Redis({
    url: getRequiredEnv("UPSTASH_REDIS_REST_URL"),
    token: getRequiredEnv("UPSTASH_REDIS_REST_TOKEN"),
  });

  return redisInstance;
}

function getRateLimiter(maxRequests: number): Ratelimit {
  const existing = limiters.get(maxRequests);
  if (existing) {
    return existing;
  }

  const limiter = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(maxRequests, RATE_LIMIT_WINDOW),
    analytics: true,
    prefix: `okiny:ratelimit:${maxRequests}`,
  });

  limiters.set(maxRequests, limiter);
  return limiter;
}

export async function checkRateLimit(
  identifier: string,
  maxRequests: number = RATE_LIMIT_UNAUTHENTICATED,
): Promise<RateLimitResult> {
  const limiter = getRateLimiter(maxRequests);

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[rate-limit] Upstash request failed:", message);
    throw new Error("[rate-limit] Failed to check rate limit with Upstash.", {
      cause: error instanceof Error ? error : undefined,
    });
  }
}
