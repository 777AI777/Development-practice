import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback handler.
 *
 * PKCE保護: @supabase/ssr の createServerClient が cookie から code_verifier を
 * 自動取得し、exchangeCodeForSession 内で PKCE 検証を実施する。
 * 手動での code_verifier 操作は不要。
 *
 * リダイレクト先: 現在は "/rankings" にハードコード。
 * 将来 `next` クエリパラメータ等で動的リダイレクトを導入する場合は、
 * 必ずホワイトリスト方式（許可パス一覧との照合）でオープンリダイレクトを防止すること。
 * 外部URLや相対パス("//evil.com")を許可してはならない。
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[auth/callback] Missing code parameter");
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("error", "auth_failed");
    return NextResponse.redirect(url);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("error", "auth_failed");
    return NextResponse.redirect(url);
  }

  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  url.pathname = user?.user_metadata?.onboarded === true ? "/rankings" : "/onboarding";
  url.search = "";
  return NextResponse.redirect(url);
}
