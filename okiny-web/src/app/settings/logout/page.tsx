"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/back-button";
import { useSessionUser } from "@/hooks/use-session-user";

export default function LogoutConfirmPage() {
  const router = useRouter();
  const { signOut } = useSessionUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  return (
    <AppShell>
      <div className="mb-4 flex items-center gap-2">
        <BackButton href="/settings" />
        <h1 className="text-lg font-bold text-foreground">設定</h1>
      </div>

      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>

          <h1 className="mt-4 text-xl font-bold text-foreground">
            ログアウトしますか？
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            ログアウトすると、再度ログインが必要になります。
          </p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={async () => {
                if (isLoggingOut) return;
                setIsLoggingOut(true);
                try {
                  await signOut();
                  router.push("/login");
                } catch (error) {
                  if (process.env.NODE_ENV !== "production") {
                    console.error("detail:", error);
                  }
                  setIsLoggingOut(false);
                }
              }}
              className="w-full rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {isLoggingOut ? "ログアウト中..." : "ログアウトする"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
