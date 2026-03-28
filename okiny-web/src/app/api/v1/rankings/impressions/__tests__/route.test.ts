import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/auth-guard", () => ({
  getAuthenticatedUserId: vi.fn(),
  authErrorResponse: vi.fn(
    () => new Response(JSON.stringify({ error: { code: "AUTH" } }), { status: 401 }),
  ),
}));

vi.mock("@/lib/supabase-rest", () => ({
  incrementImpressionCount: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() =>
    Promise.resolve({ success: true, limit: 10, remaining: 9, reset: Date.now() + 60_000 }),
  ),
}));

import { getAuthenticatedUserId } from "@/lib/supabase/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { incrementImpressionCount } from "@/lib/supabase-rest";
import { POST, _resetForTesting, _testInternals } from "../route";

const mockGetAuthenticatedUserId = vi.mocked(getAuthenticatedUserId);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockIncrementImpressionCount = vi.mocked(incrementImpressionCount);

const VALID_UUID_1 = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const VALID_UUID_2 = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
const VALID_UUID_3 = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";
const TEST_USER_ID = "test-user-id-001";
const TEST_ACCESS_TOKEN = "test-access-token";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/v1/rankings/impressions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeRawRequest(rawBody: string): Request {
  return new Request("http://localhost/api/v1/rankings/impressions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: rawBody,
  });
}

function setupAuth() {
  mockGetAuthenticatedUserId.mockResolvedValue({
    ok: true as const,
    userId: TEST_USER_ID,
    accessToken: TEST_ACCESS_TOKEN,
    userName: null,
    userAvatarUrl: null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  _resetForTesting();
  setupAuth();
  mockCheckRateLimit.mockResolvedValue({
    success: true,
    limit: 10,
    remaining: 9,
    reset: Date.now() + 60_000,
  });
  mockIncrementImpressionCount.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("POST /api/v1/rankings/impressions deduplication", () => {
  it("passes all IDs to the RPC on the first request", async () => {
    const response = await POST(makeRequest({ rankingIds: [VALID_UUID_1, VALID_UUID_2] }));

    expect(response.status).toBe(204);
    expect(mockIncrementImpressionCount).toHaveBeenCalledOnce();
    expect(mockIncrementImpressionCount).toHaveBeenCalledWith({
      rankingIds: [VALID_UUID_1, VALID_UUID_2],
      accessToken: TEST_ACCESS_TOKEN,
    });
  });

  it("skips the RPC when the same user sends the same ID again", async () => {
    await POST(makeRequest({ rankingIds: [VALID_UUID_1] }));

    const response = await POST(makeRequest({ rankingIds: [VALID_UUID_1] }));

    expect(response.status).toBe(204);
    expect(mockIncrementImpressionCount).toHaveBeenCalledOnce();
  });

  it("passes only uncached IDs when the request is partially cached", async () => {
    await POST(makeRequest({ rankingIds: [VALID_UUID_1] }));

    const response = await POST(
      makeRequest({ rankingIds: [VALID_UUID_1, VALID_UUID_2, VALID_UUID_3] }),
    );

    expect(response.status).toBe(204);
    expect(mockIncrementImpressionCount).toHaveBeenCalledTimes(2);
    expect(mockIncrementImpressionCount).toHaveBeenLastCalledWith({
      rankingIds: [VALID_UUID_2, VALID_UUID_3],
      accessToken: TEST_ACCESS_TOKEN,
    });
  });

  it("re-measures IDs after the TTL expires", async () => {
    await POST(makeRequest({ rankingIds: [VALID_UUID_1] }));

    const ttlMs = 24 * 60 * 60 * 1000;
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + ttlMs + 1);

    const response = await POST(makeRequest({ rankingIds: [VALID_UUID_1] }));

    expect(response.status).toBe(204);
    expect(mockIncrementImpressionCount).toHaveBeenCalledTimes(2);
    expect(mockIncrementImpressionCount).toHaveBeenLastCalledWith({
      rankingIds: [VALID_UUID_1],
      accessToken: TEST_ACCESS_TOKEN,
    });
  });

  it("cleans up expired entries before re-measuring", async () => {
    await POST(makeRequest({ rankingIds: [VALID_UUID_1] }));
    expect(mockIncrementImpressionCount).toHaveBeenCalledOnce();

    const ttlMs = 24 * 60 * 60 * 1000;
    const cleanupIntervalMs = 5 * 60 * 1000;
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + ttlMs + cleanupIntervalMs + 1);

    const response = await POST(makeRequest({ rankingIds: [VALID_UUID_1] }));

    expect(response.status).toBe(204);
    expect(mockIncrementImpressionCount).toHaveBeenCalledTimes(2);
    expect(mockIncrementImpressionCount).toHaveBeenLastCalledWith({
      rankingIds: [VALID_UUID_1],
      accessToken: TEST_ACCESS_TOKEN,
    });
  });

  it("tracks different users independently", async () => {
    mockGetAuthenticatedUserId.mockResolvedValue({
      ok: true as const,
      userId: "user-A",
      accessToken: TEST_ACCESS_TOKEN,
      userName: null,
      userAvatarUrl: null,
    });
    await POST(makeRequest({ rankingIds: [VALID_UUID_1] }));

    mockGetAuthenticatedUserId.mockResolvedValue({
      ok: true as const,
      userId: "user-B",
      accessToken: TEST_ACCESS_TOKEN,
      userName: null,
      userAvatarUrl: null,
    });
    const response = await POST(makeRequest({ rankingIds: [VALID_UUID_1] }));

    expect(response.status).toBe(204);
    expect(mockIncrementImpressionCount).toHaveBeenCalledTimes(2);
  });

  it("does not cache IDs when the RPC fails", async () => {
    mockIncrementImpressionCount.mockRejectedValueOnce(new Error("RPC error"));

    const failResponse = await POST(makeRequest({ rankingIds: [VALID_UUID_1] }));
    expect(failResponse.status).toBe(500);

    mockIncrementImpressionCount.mockResolvedValue(undefined);
    const response = await POST(makeRequest({ rankingIds: [VALID_UUID_1] }));

    expect(response.status).toBe(204);
    expect(mockIncrementImpressionCount).toHaveBeenCalledTimes(2);
    expect(mockIncrementImpressionCount).toHaveBeenLastCalledWith({
      rankingIds: [VALID_UUID_1],
      accessToken: TEST_ACCESS_TOKEN,
    });
  });
});

describe("POST /api/v1/rankings/impressions authentication", () => {
  it("returns 401 when the user is not authenticated", async () => {
    mockGetAuthenticatedUserId.mockResolvedValue({
      ok: false as const,
      reason: "unauthorized",
    });

    const response = await POST(makeRequest({ rankingIds: [VALID_UUID_1] }));

    expect(response.status).toBe(401);
    expect(mockIncrementImpressionCount).not.toHaveBeenCalled();
  });
});

describe("POST /api/v1/rankings/impressions rate limiting", () => {
  it("returns 429 when the rate limit is exceeded", async () => {
    mockCheckRateLimit.mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60_000,
    });

    const response = await POST(makeRequest({ rankingIds: [VALID_UUID_1] }));
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error.code).toBe("RATE_LIMIT");
    expect(mockIncrementImpressionCount).not.toHaveBeenCalled();
  });

  it("returns 500 when the rate limit check fails", async () => {
    mockCheckRateLimit.mockRejectedValueOnce(new Error("Upstash unavailable"));

    const response = await POST(makeRequest({ rankingIds: [VALID_UUID_1] }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe("SERVER");
    expect(mockIncrementImpressionCount).not.toHaveBeenCalled();
  });
});

describe("POST /api/v1/rankings/impressions validation", () => {
  it("returns 422 for empty rankingIds", async () => {
    const response = await POST(makeRequest({ rankingIds: [] }));

    expect(response.status).toBe(422);
    const data = await response.json();
    expect(data.error.code).toBe("VALIDATION");
    expect(mockIncrementImpressionCount).not.toHaveBeenCalled();
  });

  it("returns 422 for invalid UUID format", async () => {
    const response = await POST(makeRequest({ rankingIds: ["not-a-uuid"] }));

    expect(response.status).toBe(422);
    const data = await response.json();
    expect(data.error.code).toBe("VALIDATION");
    expect(mockIncrementImpressionCount).not.toHaveBeenCalled();
  });

  it("returns 422 for more than 50 IDs", async () => {
    const fiftyOneIds = Array.from(
      { length: 51 },
      (_, index) => `a0eebc99-9c0b-4ef8-bb6d-${String(index).padStart(12, "0")}`,
    );

    const response = await POST(makeRequest({ rankingIds: fiftyOneIds }));

    expect(response.status).toBe(422);
    const data = await response.json();
    expect(data.error.code).toBe("VALIDATION");
    expect(mockIncrementImpressionCount).not.toHaveBeenCalled();
  });

  it("returns 422 for invalid JSON", async () => {
    const response = await POST(makeRawRequest("{invalid json}"));

    expect(response.status).toBe(422);
    const data = await response.json();
    expect(data.error.code).toBe("VALIDATION");
    expect(mockIncrementImpressionCount).not.toHaveBeenCalled();
  });
});

describe("POST /api/v1/rankings/impressions cache size limit", () => {
  it("evicts the oldest entries when the cache exceeds the limit", async () => {
    const { IMPRESSION_CACHE, MAX_IMPRESSION_CACHE_SIZE } = _testInternals;

    const now = Date.now();
    for (let index = 0; index < MAX_IMPRESSION_CACHE_SIZE - 1; index++) {
      IMPRESSION_CACHE.set(`pre-fill-${index}:dummy-user`, now);
    }

    expect(IMPRESSION_CACHE.size).toBe(MAX_IMPRESSION_CACHE_SIZE - 1);

    const response = await POST(makeRequest({ rankingIds: [VALID_UUID_1, VALID_UUID_2] }));

    expect(response.status).toBe(204);
    expect(IMPRESSION_CACHE.size).toBeLessThanOrEqual(MAX_IMPRESSION_CACHE_SIZE);
    expect(IMPRESSION_CACHE.has("pre-fill-0:dummy-user")).toBe(false);
    expect(IMPRESSION_CACHE.has(`${VALID_UUID_1}:${TEST_USER_ID}`)).toBe(true);
    expect(IMPRESSION_CACHE.has(`${VALID_UUID_2}:${TEST_USER_ID}`)).toBe(true);
  });
});
