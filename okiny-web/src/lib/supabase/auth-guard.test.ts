import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockGetUser = vi.fn();
const mockSupabase = {
  auth: { getUser: mockGetUser },
};

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUserId } from "@/lib/supabase/auth-guard";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
});

describe("getAuthenticatedUserId", () => {
  it("認証済みユーザーの場合 { ok: true, userId } を返す", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-google-001" } },
      error: null,
    });

    const result = await getAuthenticatedUserId();

    expect(result).toEqual({ ok: true, userId: "user-google-001" });
  });

  it("未認証（user === null）の場合 { ok: false, reason: 'unauthorized' } を返す", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await getAuthenticatedUserId();

    expect(result).toEqual({ ok: false, reason: "unauthorized" });
  });

  it("Supabase エラーの場合 { ok: false, reason: 'server_error' } を返す", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "JWT expired" },
    });

    const result = await getAuthenticatedUserId();

    expect(result).toEqual({ ok: false, reason: "server_error" });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[auth-guard] getUser failed:",
      "JWT expired",
    );

    consoleErrorSpy.mockRestore();
  });
});
