"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { ENABLE_SNS_EXPANSION } from "@/lib/features";

export default function ComposerPage() {
  if (!ENABLE_SNS_EXPANSION) {
    return (
      <AppShell title="Composer" subtitle="SNS expansion is disabled.">
        <p className="text-sm text-slate-600">Enable NEXT_PUBLIC_ENABLE_SNS_EXPANSION=true to use composer routes.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Composer"
      subtitle="投稿作成の入口。既存Phase1の作成フォームへ接続しつつ、SNS導線を追加。"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-700">
          ここでは投稿ドラフトを準備し、公開前プレビューへ進みます。
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/rankings/new" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
            Open Ranking Create
          </Link>
          <Link href="/composer/preview" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            Open Publish Preview
          </Link>
          <Link href="/drafts" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            Open Drafts
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
