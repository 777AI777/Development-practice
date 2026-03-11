"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useToast } from "@/components/toast-provider";
import { useSessionUser } from "@/hooks/use-session-user";
import { DEMO_RANKING, DEMO_RANKING_ID } from "@/lib/demo-ranking";
import { publishedApiClient } from "@/lib/publish/client";
import { PublishedApiError } from "@/lib/publish/http-published-api-client";
import type { PublishedRanking } from "@/lib/types";

export default function RankingDetailPage() {
  const params = useParams<{ id: string }>();
  const rankingId = params.id;
  const { isReady, user } = useSessionUser();
  const { pushToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [ranking, setRanking] = useState<PublishedRanking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (!user) {
      return;
    }
    if (rankingId === DEMO_RANKING_ID) {
      setRanking(DEMO_RANKING);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    let canceled = false;
    setIsLoading(true);
    setErrorMessage(null);

    void publishedApiClient
      .getPublishedRanking(user.id, rankingId)
      .then((data) => {
        if (canceled) return;
        setRanking(data);
      })
      .catch((error: unknown) => {
        if (canceled) return;
        const message =
          error instanceof PublishedApiError
            ? error.message
            : "ランキング詳細の読み込みに失敗しました。";
        setErrorMessage(message);
        pushToast({ type: "error", message });
      })
      .finally(() => {
        if (canceled) return;
        setIsLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [isReady, pushToast, rankingId, user]);

  return (
    <AppShell
      title="ランキング詳細"
      subtitle="閲覧専用の詳細画面。編集・削除アクション付き（モック04）。"
    >
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-8 w-56 animate-pulse rounded bg-slate-100" />
          <div className="h-48 animate-pulse rounded bg-slate-100" />
        </div>
      ) : errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      ) : ranking ? (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-slate-900">{ranking.title}</h2>
          <p className="text-sm text-slate-600">タグ: {ranking.tagId}</p>
          <ol className="space-y-2">
            {ranking.items.map((item, index) => (
              <li
                key={`${ranking.id}-${index}`}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                {index + 1}. {item}
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/rankings/${ranking.id}/edit`}
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
            >
              編集
            </Link>
            <Link
              href={`/rankings/${ranking.id}/delete`}
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700"
            >
              削除
            </Link>
            <Link
              href="/rankings"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              戻る
            </Link>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
