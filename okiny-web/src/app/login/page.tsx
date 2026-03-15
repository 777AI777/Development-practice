"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { useSessionUser } from "@/hooks/use-session-user";
import { createClient } from "@/lib/supabase/client";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isReady } = useSessionUser();
  const nextRoute = "/rankings";
  const hasNavigatedRef = useRef(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const authError = searchParams.get("error");

  useEffect(() => {
    if (isReady && user && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      router.replace(nextRoute);
    }
  }, [isReady, nextRoute, router, user]);

  const handleGoogleLogin = async () => {
    if (hasNavigatedRef.current || isSigningIn) return;
    setIsSigningIn(true);
    setLoginError(null);

    const supabase = createClient();

    if (!process.env.NEXT_PUBLIC_APP_URL && process.env.NODE_ENV === "production") {
      setIsSigningIn(false);
      setLoginError("システム設定エラーが発生しました。管理者にお問い合わせください。");
      return;
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${appUrl}/api/auth/callback`,
      },
    });

    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[login] OAuth error:", error.message);
      }
      setIsSigningIn(false);
      setLoginError("ログインに失敗しました。もう一度お試しください。");
      return;
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary">OKINY</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ランキング共有SNS
        </p>
      </div>

      <main className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-center text-lg font-bold text-foreground">
          アカウントにログイン
        </h2>

        {(authError || loginError) && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {loginError ?? "ログインに失敗しました。もう一度お試しください。"}
          </div>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
          >
            <svg
              className="h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
                fill="#EA4335"
              />
            </svg>
            <span className="flex-1">
              {isSigningIn ? "リダイレクト中..." : "Googleでログイン"}
            </span>
          </button>
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          その他のログイン方法は準備中です
        </p>
      </main>

      <p className="mt-6 max-w-xs text-center text-xs leading-relaxed text-muted-foreground">
        ログインすることで利用規約およびプライバシーポリシーに同意したものとみなします。
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
