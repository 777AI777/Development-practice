"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { useSessionUser } from "@/hooks/use-session-user";

export default function LogoutConfirmPage() {
  const router = useRouter();
  const { signOut } = useSessionUser();

  return (
    <AppShell
      title="ログアウト確認"
      subtitle="mock 07a のログアウト確認画面。"
    >
      <div className="space-y-4">
        <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          ログアウトしますか？
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              signOut();
              router.push("/login");
            }}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white"
          >
            ログアウト
          </button>
          <Link href="/settings" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            戻る
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
