"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useSessionUser } from "@/hooks/use-session-user";
import { trackEvent } from "@/lib/analytics";
import { ENABLE_SNS_EXPANSION } from "@/lib/features";
import { MOCK_USERS } from "@/lib/mock-users";

export default function LoginPage() {
  const router = useRouter();
  const { user, isReady, signInAs } = useSessionUser();
  const nextRoute = ENABLE_SNS_EXPANSION ? "/onboarding" : "/rankings";

  useEffect(() => {
    if (isReady && user) {
      router.replace(nextRoute);
    }
  }, [isReady, nextRoute, router, user]);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <main className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">ログイン</h1>
        <p className="mt-2 text-sm text-slate-600">
          モック01のログイン画面です。
        </p>
        <div className="mt-8 space-y-3">
          {MOCK_USERS.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                signInAs(user.id);
                trackEvent("login_success", {
                  user_id: user.id,
                  provider: "google",
                  entry_route: "/login",
                });
                router.push(nextRoute);
              }}
              className="flex w-full items-center justify-between rounded-md bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"
            >
              <span>Googleでログイン（{user.name}）</span>
              <span>{user.email}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
