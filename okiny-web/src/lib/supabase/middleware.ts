import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { shouldRedirectToOnboarding } from "@/lib/onboarding-utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { buildContentSecurityPolicy } from "@/lib/security-headers";

/**
 * 認証不要なパス。新しいパブリックパスを追加する場合はここに追記すること。
 * 全API（/api/v1/...）はデフォルトで認証必須。
 *
 * EXACT_PUBLIC_PATHS: 完全一致で認証除外
 * PREFIX_PUBLIC_PATHS: 前方一致で認証除外（サブパスを含む）
 */
const EXACT_PUBLIC_PATHS = ["/login", "/api/auth/callback", "/terms", "/privacy"] as const;
// WARNING: /api/v1/users 配下の新規エンドポイントはmiddlewareの認証をスキップするため、
// 認証が必要なエンドポイントは route handler 内で getAuthenticatedUserId() を使うこと
const PREFIX_PUBLIC_PATHS = ["/api/og", "/api/v1/users", "/share", "/users"] as const;

async function hashString(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/**
 * Supabase の auth cookie からユーザー識別子を簡易抽出する。
 * cookie名は `sb-<project-ref>-auth-token` パターン。
 * getUser() は呼ばず、cookie の有無のみで判定する。
 * cookie値はSHA-256ハッシュ化してキー空間汚染を防ぐ。
 */
async function extractRateLimitIdentifier(request: NextRequest): Promise<string> {
  const authCookie = request.cookies
    .getAll()
    .find((c) => /^sb-.+-auth-token/.test(c.name));

  if (authCookie) {
    const hash = await hashString(authCookie.value.slice(0, 64));
    return `cookie:${hash}`;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return `ip:${ip}`;
}

function setRateLimitHeaders(
  response: NextResponse,
  result: { limit: number; remaining: number; reset: number },
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(result.reset));
  return response;
}

function setCspHeaders(
  response: NextResponse,
  nonce: string,
): NextResponse {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  try {
    const csp = buildContentSecurityPolicy(supabaseUrl, nonce);
    response.headers.set("Content-Security-Policy", csp);
  } catch (error) {
    console.error("[CSP] Failed to build Content-Security-Policy:", error);
    response.headers.set("Content-Security-Policy", "default-src 'self'");
  }

  response.headers.delete("x-nonce");

  return response;
}

export async function updateSession(request: NextRequest, nonce: string) {
  // リクエストヘッダーにnonceを設定（Server Componentからheaders()で読み取るため）
  request.headers.set("x-nonce", nonce);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // リクエストヘッダーにCSPを設定（Next.jsが内部スクリプトにnonceを自動付与するため）
  if (supabaseUrl) {
    try {
      const csp = buildContentSecurityPolicy(supabaseUrl, nonce);
      request.headers.set("content-security-policy", csp);
    } catch {
      // CSP構築失敗時はフォールバック（レスポンス側のsetCspHeadersでも設定される）
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[middleware] Supabase environment variables are not configured.");
    return setCspHeaders(new NextResponse("Internal Server Error", { status: 500 }), nonce);
  }

  // --- レート制限チェック（認証前、APIルートのみ） ---
  const { pathname } = request.nextUrl;
  let rateLimitInfo: { limit: number; remaining: number; reset: number } | null = null;

  if (pathname.startsWith("/api/")) {
    const identifier = await extractRateLimitIdentifier(request);
    const rateLimitResult = await checkRateLimit(identifier);

    if (rateLimitResult && !rateLimitResult.success) {
      return setCspHeaders(NextResponse.json(
        { error: { code: "RATE_LIMIT_EXCEEDED", message: "リクエスト数が上限を超えました。しばらく待ってから再試行してください。" } },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.reset),
          },
        },
      ), nonce);
    }

    // rateLimitResult が null の場合はスキップ（env未設定 or Upstash障害）
    if (rateLimitResult) {
      rateLimitInfo = { limit: rateLimitResult.limit, remaining: rateLimitResult.remaining, reset: rateLimitResult.reset };
    }
  }

  // --- Supabase セッション更新 ---
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // getSession() は cookie デコードのみ（HTTP通信なし）。
  // JWT 署名検証は Server Component の auth-guard に委任する。
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // session.user は cookie の JWT payload をデコードした結果であり、
  // サーバーサイドでの署名検証は行われていない。
  // ルーティング判定にのみ使用し、データアクセスの認証は auth-guard で行う。
  const user = session?.user ?? null;

  const isPublicPath =
    EXACT_PUBLIC_PATHS.some((p) => pathname === p) ||
    PREFIX_PUBLIC_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!user && !isPublicPath) {
    if (pathname.startsWith("/api/")) {
      const response = NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "認証が必要です。" } },
        { status: 401 },
      );
      // 401でもレート制限ヘッダーを付与
      if (rateLimitInfo) {
        setRateLimitHeaders(response, rateLimitInfo);
      }
      return setCspHeaders(response, nonce);
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return setCspHeaders(NextResponse.redirect(url), nonce);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = shouldRedirectToOnboarding(user.user_metadata as Record<string, unknown>) ? "/onboarding" : "/rankings";
    return setCspHeaders(NextResponse.redirect(url), nonce);
  }

  // 認証済みユーザーで display_user_id 未設定なら /onboarding にリダイレクト
  // ただし /onboarding 自体、公開パス、APIパスは除外（リダイレクトループ防止）
  if (
    user &&
    pathname !== "/onboarding" &&
    !isPublicPath &&
    !pathname.startsWith("/api/") &&
    shouldRedirectToOnboarding(user.user_metadata as Record<string, unknown>)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return setCspHeaders(NextResponse.redirect(url), nonce);
  }

  // 成功レスポンスにレート制限ヘッダーを付与
  if (rateLimitInfo) {
    setRateLimitHeaders(supabaseResponse, rateLimitInfo);
  }

  return setCspHeaders(supabaseResponse, nonce);
}
