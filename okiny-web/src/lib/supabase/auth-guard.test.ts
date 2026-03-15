import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockGetUser = vi.fn();
const mockGetSession = vi.fn();
const mockSupabase = {
  auth: { getUser: mockGetUser, getSession: mockGetSession },
};

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUserId } from "@/lib/supabase/auth-guard";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
});

describe("getAuthenticatedUserId", () => {
  it("認証済みユーザーの場合 { ok: true, userId, accessToken } を返す", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-google-001" } },
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
    });
  });

  it("未認証（user === null）の場合 { ok: false, reason: 'unauthorized' } を返す", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "jwt-token-abc" } },
      error: null,
    });
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await getAuthenticatedUserId();

    expect(result).toEqual({ ok: false, reason: "unauthorized" });
  });

  it("Supabase getUser エラーの場合 { ok: false, reason: 'server_error' } を返す", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "jwt-token-abc" } },
      error: null,
    });
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "JWT expired" },
    });

    const result = await getAuthenticatedUserId();

    expect(result).toEqual({ ok: false, reason: "server_error" });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[auth-guard] getUser failed",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[auth-guard] detail:",
      "JWT expired",
    );

    consoleErrorSpy.mockRestore();
  });

  it("getSession がエラーの場合 { ok: false, reason: 'unauthorized' } を返す", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: { message: "Session not found" },
    });

    const result = await getAuthenticatedUserId();

    expect(result).toEqual({ ok: false, reason: "unauthorized" });
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[auth-guard] getSession failed",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[auth-guard] session detail:",
      "Session not found",
    );

    consoleErrorSpy.mockRestore();
  });

  it("getSession が session null（エラーなし）の場合 { ok: false, reason: 'unauthorized' } を返す", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const result = await getAuthenticatedUserId();

    expect(result).toEqual({ ok: false, reason: "unauthorized" });
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[auth-guard] getSession failed",
    );

    consoleErrorSpy.mockRestore();
  });

  it("session に access_token が undefined の場合は unauthorized を返す", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockGetSession.mockResolvedValue({
      data: { session: { access_token: undefined } },
      error: null,
    });

    const result = await getAuthenticatedUserId();

    expect(result).toEqual({ ok: false, reason: "unauthorized" });
    expect(mockGetUser).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("session が空オブジェクト（access_token プロパティなし）の場合は unauthorized を返す", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockGetSession.mockResolvedValue({
      data: { session: {} },
      error: null,
    });

    const result = await getAuthenticatedUserId();

    expect(result).toEqual({ ok: false, reason: "unauthorized" });
    expect(mockGetUser).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
