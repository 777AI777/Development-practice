"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";

export default function NotFoundStatePage() {
  return (
    <AppShell
      title="404状態"
      subtitle="モック15（カスタム404案内画面）"
    >
      <div className="space-y-4">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          404. 指定されたページは存在しません。
        </div>
        <Link href="/rankings" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
          ランキング一覧へ戻る
        </Link>
      </div>
    </AppShell>
  );
}

