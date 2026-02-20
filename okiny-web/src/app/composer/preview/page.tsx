"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { ENABLE_SNS_EXPANSION } from "@/lib/features";

export default function PublishPreviewPage() {
  if (!ENABLE_SNS_EXPANSION) {
    return (
      <AppShell title="Publish Preview" subtitle="SNS expansion is disabled.">
        <p className="text-sm text-slate-600">Enable NEXT_PUBLIC_ENABLE_SNS_EXPANSION=true to use preview routes.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Publish Preview"
      subtitle="公開前確認画面。SNS導線では Composer -> Preview -> Post Detail の順で遷移。"
    >
      <div className="space-y-4">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Preview sample</p>
          <p className="mt-1">タイトル・タグ・上位3項目を確認してから投稿します。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/feed/demo" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
            Publish and open post detail
          </Link>
          <Link href="/composer" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            Back to Composer
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
