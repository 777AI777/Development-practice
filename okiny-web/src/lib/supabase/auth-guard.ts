import { cache } from "react";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export type AuthResult =
  | { ok: true; userId: string; accessToken: string; userName: string | null }
  | { ok: false; reason: "unauthorized" | "server_error" };

export function authErrorResponse(
  result: Extract<AuthResult, { ok: false }>,
): NextResponse {
  const status = result.reason === "unauthorized" ? 401 : 503;
  const code = result.reason === "unauthorized" ? "UNAUTHORIZED" : "SERVER";
  const message =
    result.reason === "unauthorized"
      ? "認証が必要です。"
      : "認証サービスに接続できません。";
  return NextResponse.json({ error: { code, message } }, { status });
}

/**
 * Supabase クライアントをリクエスト単位でメモ化。
 * getCachedSession / getCachedUser が同一インスタンスを共有する。
 */
const getCachedClient = cache(async () => createClient());

/**
 * Supabase getSession() をリクエスト単位でメモ化。
 * cookie デコードのみで HTTP 通信なし。accessToken 取得用。
 */
const getCachedSession = cache(async () => {
  const supabase = await getCachedClient();
  return supabase.auth.getSession();
});

/**
 * Supabase getUser() をリクエスト単位でメモ化。
 * JWT 署名検証（Supabase API への HTTP 通信）を同一リクエスト内で1回のみに抑える。
 */
const getCachedUser = cache(async () => {
  const supabase = await getCachedClient();
  return supabase.auth.getUser();
});

export async function getAuthenticatedUserId(): Promise<AuthResult> {
  // セッションからトークンを先に取得（cache済み）
  const {
    data: { session },
    error: sessionError,
  } = await getCachedSession();

  if (sessionError || !session?.access_token) {
    console.error("[auth-guard] getSession failed");
    if (process.env.NODE_ENV !== "production" && sessionError) {
      console.error("[auth-guard] session detail:", sessionError.message);
    }
    return { ok: false, reason: "unauthorized" };
  }

  // ユーザーの存在をサーバーサイドで検証（JWT署名検証、cache済み）
  const {
    data: { user },
    error,
  } = await getCachedUser();

  if (error) {
    console.error("[auth-guard] getUser failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[auth-guard] detail:", error.message);
    }
    return { ok: false, reason: "server_error" };
  }

  if (!user) {
    return { ok: false, reason: "unauthorized" };
  }

  return {
    ok: true,
    userId: user.id,
    accessToken: session.access_token,
    userName:
      user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
  };
}
