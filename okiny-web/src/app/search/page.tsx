"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useToast } from "@/components/toast-provider";
import { SHOW_STATE_SCREENS } from "@/lib/features";
import { useSessionUser } from "@/hooks/use-session-user";
import { HttpPublishedApiClient, PublishedApiError } from "@/lib/publish/http-published-api-client";
import { FIXED_TAGS, getTagLabel } from "@/lib/tags";
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
    <AppShell>
      <div className="space-y-4">
        {/* Header: back */}
        <Link
          href="/rankings"
          className="flex h-8 w-8 items-center justify-center text-lg font-bold text-foreground"
          aria-label="戻る"
        >
          {"\u2190"}
        </Link>

        {/* Popular tags */}
        <div>
          <h2 className="text-sm font-semibold text-foreground">人気のタグ</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {FIXED_TAGS.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setTagId(tag.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  tagId === tag.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {SHOW_STATE_SCREENS ? (
          <Link
            href="/states/empty-search"
            className="inline-flex rounded-md border border-border px-3 py-2 text-xs text-muted-foreground"
          >
            空の検索結果画面を開く (10)
          </Link>
        ) : null}

        {/* Results */}
        {isLoading ? (
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
        ) : results.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              選択したタグのランキングは見つかりませんでした。
            </p>
            <Link
              href={`/rankings/new?tagId=${encodeURIComponent(tagId)}`}
              className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              このタグでランキングを作成
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-foreground mb-3">「{getTagLabel(tagId)}」の検索結果</h2>
            <div className="space-y-3">
              {results.map((ranking) => (
                <div
                  key={ranking.id}
                  className="rounded-xl p-4 cursor-pointer bg-card"
                >
                  <Link
                    href={`/rankings/${ranking.id}`}
                    className="block transition hover:opacity-80"
                  >
                    <p className="font-semibold text-foreground">{ranking.title}</p>
                    <span className="mt-1 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                      {getTagLabel(ranking.tagId)}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
