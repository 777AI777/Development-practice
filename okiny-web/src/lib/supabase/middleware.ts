import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { shouldRedirectToOnboarding } from "@/lib/onboarding-utils";
import { checkRateLimit, RATE_LIMIT_AUTHENTICATED, RATE_LIMIT_UNAUTHENTICATED } from "@/lib/rate-limit";
import { buildContentSecurityPolicy } from "@/lib/security-headers";

const EXACT_PUBLIC_PATHS = ["/login", "/api/auth/callback", "/terms", "/privacy"] as const;
// /api/v1/users 配下は公開 API を含むため、詳細な認証は各 route handler 側で行う。
const PREFIX_PUBLIC_PATHS = ["/api/og", "/api/v1/users", "/share", "/users"] as const;

async function hashString(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

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

function setCspHeaders(response: NextResponse, nonce: string): NextResponse {
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
  request.headers.set("x-nonce", nonce);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl) {
    try {
      const csp = buildContentSecurityPolicy(supabaseUrl, nonce);
      request.headers.set("content-security-policy", csp);
    } catch {
      // Response 側でフォールバックを設定する。
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[middleware] Supabase environment variables are not configured.");
    return setCspHeaders(new NextResponse("Internal Server Error", { status: 500 }), nonce);
  }

  const { pathname } = request.nextUrl;
  let rateLimitInfo: { limit: number; remaining: number; reset: number } | null = null;

  if (pathname.startsWith("/api/")) {
    const identifier = await extractRateLimitIdentifier(request);

    try {
      const maxRequests = identifier.startsWith("cookie:")
        ? RATE_LIMIT_AUTHENTICATED
        : RATE_LIMIT_UNAUTHENTICATED;
      const rateLimitResult = await checkRateLimit(identifier, maxRequests);

      if (!rateLimitResult.success) {
        return setCspHeaders(
          NextResponse.json(
            {
              error: {
                code: "RATE_LIMIT_EXCEEDED",
                message: "リクエスト数が上限を超えました。しばらく待ってから再度お試しください。",
              },
            },
            {
              status: 429,
              headers: {
                "X-RateLimit-Limit": String(rateLimitResult.limit),
                "X-RateLimit-Remaining": String(rateLimitResult.remaining),
                "X-RateLimit-Reset": String(rateLimitResult.reset),
              },
            },
          ),
          nonce,
        );
      }

      rateLimitInfo = {
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
      };
    } catch (error) {
      console.error("[middleware] Rate limit check failed:", error);
      return setCspHeaders(
        NextResponse.json(
          {
            error: {
              code: "SERVER",
              message: "一時的にアクセス制御を確認できませんでした。しばらくしてからもう一度お試しください。",
            },
          },
          { status: 500 },
        ),
        nonce,
      );
    }
  }

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
    data: { session },
  } = await supabase.auth.getSession();

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
    url.pathname = shouldRedirectToOnboarding(user.user_metadata as Record<string, unknown>)
      ? "/onboarding"
      : "/rankings";
    return setCspHeaders(NextResponse.redirect(url), nonce);
  }

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

  if (rateLimitInfo) {
    setRateLimitHeaders(supabaseResponse, rateLimitInfo);
  }

  return setCspHeaders(supabaseResponse, nonce);
}
