import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/rate-limit";

const PUBLIC_PATHS = ["/login", "/api/auth/callback"] as const;

/**
 * Supabase の auth cookie からユーザー識別子を簡易抽出する。
 * cookie名は `sb-<project-ref>-auth-token` パターン。
 * getUser() は呼ばず、cookie の有無のみで判定する。
 */
function extractRateLimitIdentifier(request: NextRequest): string {
  const authCookie = request.cookies
    .getAll()
    .find((c) => /^sb-.+-auth-token/.test(c.name));

  if (authCookie) {
    return `cookie:${authCookie.name}:${authCookie.value.slice(0, 32)}`;
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

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[middleware] Supabase environment variables are not configured.");
    return new NextResponse("Internal Server Error", { status: 500 });
  }

  // --- レート制限チェック（認証前、APIルートのみ） ---
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const identifier = extractRateLimitIdentifier(request);
    const rateLimitResult = await checkRateLimit(identifier);

    if (rateLimitResult && !rateLimitResult.success) {
      const response = NextResponse.json(
        { error: { code: "RATE_LIMIT_EXCEEDED", message: "リクエスト数が上限を超えました。しばらく待ってから再試行してください。" } },
        { status: 429 },
      );
      return setRateLimitHeaders(response, rateLimitResult);
    }

    // rateLimitResult が null の場合はスキップ（env未設定 or Upstash障害）
    // 成功時のヘッダーは最終レスポンスに付与する（後段で処理）
    if (rateLimitResult) {
      // レート制限の結果を後続処理で使うためリクエストヘッダーに一時保存
      request.headers.set("x-ratelimit-limit", String(rateLimitResult.limit));
      request.headers.set("x-ratelimit-remaining", String(rateLimitResult.remaining));
      request.headers.set("x-ratelimit-reset", String(rateLimitResult.reset));
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p);

  if (!user && !isPublicPath) {
    if (pathname.startsWith("/api/")) {
      const response = NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "認証が必要です。" } },
        { status: 401 },
      );
      // 401でもレート制限ヘッダーを付与
      const limit = request.headers.get("x-ratelimit-limit");
      if (limit) {
        response.headers.set("X-RateLimit-Limit", limit);
        response.headers.set("X-RateLimit-Remaining", request.headers.get("x-ratelimit-remaining") ?? "");
        response.headers.set("X-RateLimit-Reset", request.headers.get("x-ratelimit-reset") ?? "");
      }
      return response;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/rankings";
    return NextResponse.redirect(url);
  }

  // 成功レスポンスにレート制限ヘッダーを付与
  if (pathname.startsWith("/api/")) {
    const limit = request.headers.get("x-ratelimit-limit");
    if (limit) {
      setRateLimitHeaders(supabaseResponse, {
        limit: Number(limit),
        remaining: Number(request.headers.get("x-ratelimit-remaining") ?? 0),
        reset: Number(request.headers.get("x-ratelimit-reset") ?? 0),
      });
    }
  }

  return supabaseResponse;
}
