import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_WINDOW = "1 m";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

let rateLimiter: Ratelimit | null = null;

function getRequiredEnv(name: "UPSTASH_REDIS_REST_URL" | "UPSTASH_REDIS_REST_TOKEN"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[rate-limit] ${name} is not configured.`);
  }

  return value;
}

function getRateLimiter(): Ratelimit {
  if (rateLimiter) {
    return rateLimiter;
  }

  const redis = new Redis({
    url: getRequiredEnv("UPSTASH_REDIS_REST_URL"),
    token: getRequiredEnv("UPSTASH_REDIS_REST_TOKEN"),
  });

  rateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW),
    analytics: true,
    prefix: "okiny:ratelimit",
  });

  return rateLimiter;
}

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const limiter = getRateLimiter();

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
