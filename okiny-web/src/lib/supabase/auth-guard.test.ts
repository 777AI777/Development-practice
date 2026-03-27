import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockGetClaims = vi.fn();
const mockGetSession = vi.fn();
const mockSupabase = {
  auth: { getClaims: mockGetClaims, getSession: mockGetSession },
};

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUserId } from "@/lib/supabase/auth-guard";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue(
    mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>,
  );
});

describe("getAuthenticatedUserId", () => {
  it("returns auth info when session and claims are present", async () => {
    mockGetClaims.mockResolvedValue({
      data: { claims: { sub: "user-google-001" } },
      error: null,
    });
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "jwt-token-abc" } },
      error: null,
    });

    const result = await getAuthenticatedUserId();

    expect(result).toEqual({
      ok: true,
      userId: "user-google-001",
      accessToken: "jwt-token-abc",
      userName: null,
    });
  });

  it("returns userName from claims metadata when available", async () => {
    mockGetClaims.mockResolvedValue({
      data: {
        claims: {
          sub: "user-google-001",
          user_metadata: { name: "Alice" },
        },
      },
      error: null,
    });
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "jwt-token-abc" } },
      error: null,
    });

    const result = await getAuthenticatedUserId();

    expect(result).toEqual({
      ok: true,
      userId: "user-google-001",
      accessToken: "jwt-token-abc",
      userName: "Alice",
    });
  });

  it("returns unauthorized when claims do not include sub", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "jwt-token-abc" } },
      error: null,
    });
    mockGetClaims.mockResolvedValue({
      data: { claims: {} },
      error: null,
    });

    const result = await getAuthenticatedUserId();

    expect(result).toEqual({ ok: false, reason: "unauthorized" });
  });

  it("returns server_error when getClaims fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "jwt-token-abc" } },
      error: null,
    });
    mockGetClaims.mockResolvedValue({
      data: null,
      error: { message: "JWT expired" },
    });

    const result = await getAuthenticatedUserId();

    expect(result).toEqual({ ok: false, reason: "server_error" });
    expect(consoleErrorSpy).toHaveBeenCalledWith("[auth-guard] getClaims failed");
    expect(consoleErrorSpy).toHaveBeenCalledWith("[auth-guard] detail:", "JWT expired");

    consoleErrorSpy.mockRestore();
  });

  it("returns unauthorized when getSession fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: { message: "Session not found" },
    });

    const result = await getAuthenticatedUserId();

    expect(result).toEqual({ ok: false, reason: "unauthorized" });
    expect(mockGetClaims).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith("[auth-guard] getSession failed");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[auth-guard] session detail:",
      "Session not found",
    );

    consoleErrorSpy.mockRestore();
  });

  it("returns unauthorized when session has no access token", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockGetSession.mockResolvedValue({
      data: { session: {} },
      error: null,
    });

    const result = await getAuthenticatedUserId();

    expect(result).toEqual({ ok: false, reason: "unauthorized" });
    expect(mockGetClaims).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
