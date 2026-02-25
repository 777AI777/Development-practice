"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useToast } from "@/components/toast-provider";
import { SHOW_STATE_SCREENS } from "@/lib/features";
import { useSessionUser } from "@/hooks/use-session-user";
import { HttpPublishedApiClient, PublishedApiError } from "@/lib/publish/http-published-api-client";
import { FIXED_TAGS } from "@/lib/tags";
import type { PublishedRanking } from "@/lib/types";

const apiClient = new HttpPublishedApiClient();

export default function TagSearchPage() {
  const { user } = useSessionUser();
  const { pushToast } = useToast();
  const [tagId, setTagId] = useState(FIXED_TAGS[0]?.id ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PublishedRanking[]>([]);

  useEffect(() => {
    if (!user || !tagId) {
      return;
    }

    let canceled = false;
    setIsLoading(true);
    void apiClient
      .listPublishedRankings(user.id, tagId)
      .then((data) => {
        if (canceled) return;
        setResults(data);
      })
      .catch((error: unknown) => {
        if (canceled) return;
        const message =
          error instanceof PublishedApiError ? error.message : "ランキング検索に失敗しました。";
        pushToast({ type: "error", message });
      })
      .finally(() => {
        if (canceled) return;
        setIsLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [pushToast, tagId, user]);

  return (
    <AppShell
      title="タグ検索"
      subtitle="固定タグでランキングを絞り込みます。モック05に対応。"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="tag-filter" className="text-sm font-semibold text-slate-700">
            タグ
          </label>
          <select
            id="tag-filter"
            value={tagId}
            onChange={(event) => setTagId(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {FIXED_TAGS.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.label}
              </option>
            ))}
          </select>
          {SHOW_STATE_SCREENS ? (
            <Link href="/states/empty-search" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              空の検索結果画面を開く (10)
            </Link>
          ) : null}
        </div>

        {isLoading ? (
          <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ) : results.length === 0 ? (
          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-600">選択したタグのランキングは見つかりませんでした。</p>
            <Link
              href={`/rankings/new?tagId=${encodeURIComponent(tagId)}`}
              className="inline-flex rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white"
            >
              このタグでランキングを作成
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {results.map((ranking) => (
              <li key={ranking.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="font-semibold text-slate-900">{ranking.title}</p>
                <p className="text-xs text-slate-600">タグ: {ranking.tagId}</p>
                <Link
                  href={`/rankings/${ranking.id}`}
                  className="mt-2 inline-flex rounded-md border border-blue-300 px-3 py-1 text-xs font-semibold text-blue-700"
                >
                  詳細を開く
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
