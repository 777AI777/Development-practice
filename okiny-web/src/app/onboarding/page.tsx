"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppShell } from "@/components/app-shell";
import { ENABLE_SNS_EXPANSION } from "@/lib/features";

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    if (!ENABLE_SNS_EXPANSION) {
      router.replace("/rankings");
    }
  }, [router]);

  return (
    <AppShell
      title="オンボーディング"
      subtitle="興味タグと使い方を最短で案内し、初回投稿までの到達時間を短縮します。"
    >
      <div className="space-y-4">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">OKINY SNS ベータへようこそ</p>
          <p className="mt-1">
            1分で「見る」「作る」「つながる」の3導線をセットアップします。
          </p>
        </div>
        <ol className="space-y-2 text-sm text-slate-700">
          <li className="rounded-md border border-slate-200 bg-white px-3 py-2">
            1. 興味タグを選択（映画・音楽・カフェなど）
          </li>
          <li className="rounded-md border border-slate-200 bg-white px-3 py-2">
            2. まずはホームフィードを確認
          </li>
          <li className="rounded-md border border-slate-200 bg-white px-3 py-2">
            3. 投稿作成画面から最初の投稿を作成
          </li>
        </ol>
        <div className="flex flex-wrap gap-2">
          <Link href="/feed" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
            ホームフィードを始める
          </Link>
          <Link href="/composer" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            投稿作成を開く
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
