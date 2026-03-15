"use client";

import Link from "next/link";
import { useEffect } from "react";

import { AppShell } from "@/components/app-shell";
import { usePageTransition } from "@/components/page-transition-provider";
import { ENABLE_SNS_EXPANSION } from "@/lib/features";

export default function PublishPreviewPage() {
  const { signalReady } = usePageTransition();

  useEffect(() => {
    signalReady();
  }, [signalReady]);
  if (!ENABLE_SNS_EXPANSION) {
    return (
      <AppShell title="公開プレビュー" subtitle="SNS拡張は無効です。">
        <p className="text-sm text-slate-600">
          公開プレビュー画面を利用するには `NEXT_PUBLIC_ENABLE_SNS_EXPANSION=true` を有効にしてください。
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="公開プレビュー"
      subtitle="公開前確認画面。SNS導線では 投稿作成 → 公開プレビュー → 投稿詳細 の順で遷移。"
    >
      <div className="space-y-4">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">プレビューサンプル</p>
          <p className="mt-1">タイトル・タグ・上位3項目を確認してから投稿します。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/feed/demo" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
            公開して投稿詳細を開く
          </Link>
          <Link href="/composer" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            投稿作成に戻る
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
