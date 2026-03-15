"use client";

import Link from "next/link";
import { useEffect } from "react";

import { AppShell } from "@/components/app-shell";
import { usePageTransition } from "@/components/page-transition-provider";
import { ENABLE_SNS_EXPANSION } from "@/lib/features";

export default function ComposerPage() {
  const { signalReady } = usePageTransition();

  useEffect(() => {
    signalReady();
  }, [signalReady]);
  if (!ENABLE_SNS_EXPANSION) {
    return (
      <AppShell title="投稿作成" subtitle="SNS拡張は無効です。">
        <p className="text-sm text-slate-600">
          投稿作成画面を利用するには `NEXT_PUBLIC_ENABLE_SNS_EXPANSION=true` を有効にしてください。
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="投稿作成"
      subtitle="投稿作成の入口。既存フェーズ1の作成フォームへ接続しつつ、SNS導線を追加。"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-700">
          ここでは投稿ドラフトを準備し、公開前プレビューへ進みます。
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/rankings/new" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
            ランキング作成を開く
          </Link>
          <Link href="/composer/preview" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            公開プレビューを開く
          </Link>
          <Link href="/drafts" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
            下書き一覧を開く
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
