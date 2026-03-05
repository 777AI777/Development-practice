"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useSessionUser } from "@/hooks/use-session-user";
import {
  HttpPublishedApiClient,
  PublishedApiError,
} from "@/lib/publish/http-published-api-client";
import { FIXED_TAGS } from "@/lib/tags";
import type { PublishedRanking } from "@/lib/types";

const apiClient = new HttpPublishedApiClient();
const TAG_ORDER = FIXED_TAGS.map((tag) => tag.id);

const TEXT = {
  title: "\u30DE\u30A4\u30E9\u30F3\u30AD\u30F3\u30B0",
  subtitleDefault:
    "\u4F5C\u6210\u30FB\u7DE8\u96C6\u30FB\u524A\u9664\u30FB\u95B2\u89A7\u304C\u3067\u304D\u307E\u3059\u3002",
  subtitleEmpty: "\u307E\u3060\u30E9\u30F3\u30AD\u30F3\u30B0\u304C\u3042\u308A\u307E\u305B\u3093\u3002",
  newRanking: "\u65B0\u898F\u30E9\u30F3\u30AD\u30F3\u30B0",
  loadErrorTitle:
    "\u30E9\u30F3\u30AD\u30F3\u30B0\u306E\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002",
  reload: "\u518D\u8AAD\u307F\u8FBC\u307F",
  emptyTitle:
    "\u30E9\u30F3\u30AD\u30F3\u30B0\u304C\u307E\u3060\u3042\u308A\u307E\u305B\u3093",
  emptyBody:
    "\u65B0\u898F\u4F5C\u6210\u304B\u3089\u3001\u3042\u306A\u305F\u306E\u597D\u304D\u306A\u3082\u306E\u3092\u767B\u9332\u3067\u304D\u307E\u3059\u3002",
  createFirst: "\u65B0\u898F\u30E9\u30F3\u30AD\u30F3\u30B0\u4F5C\u6210",
  searchTags: "\u30BF\u30B0\u691C\u7D22\u3078",
  tagPrefix: "\u30BF\u30B0",
  detail: "\u8A73\u7D30",
  edit: "\u7DE8\u96C6",
  delete: "\u524A\u9664",
} as const;

const TAG_LABELS_JA: Record<string, string> = {
  movie: "\u6620\u753B",
  music: "\u97F3\u697D",
  travel: "\u65C5\u884C",
  cafe: "\u30AB\u30D5\u30A7",
  cosmetics: "\u5316\u7CA7\u54C1",
  daily: "\u65E5\u7528\u54C1",
};

function getTagLabel(tagId: string): string {
  return TAG_LABELS_JA[tagId] ?? tagId;
}

function groupRankingsByTag(rankings: PublishedRanking[]) {
  const groups = new Map<string, PublishedRanking[]>();

  for (const ranking of rankings) {
    const bucket = groups.get(ranking.tagId);
    if (bucket) {
      bucket.push(ranking);
      continue;
    }
    groups.set(ranking.tagId, [ranking]);
  }

  return Array.from(groups.entries())
    .map(([tagId, items]) => ({ tagId, items }))
    .sort((a, b) => {
      const aIndex = TAG_ORDER.indexOf(a.tagId);
      const bIndex = TAG_ORDER.indexOf(b.tagId);
      const aRank = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
      const bRank = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;

      if (aRank !== bRank) {
        return aRank - bRank;
      }

      return a.tagId.localeCompare(b.tagId);
    });
}

function RankingsPageContent() {
  const searchParams = useSearchParams();
  const requestedState = searchParams.get("state");
  const { isReady, user } = useSessionUser();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rankings, setRankings] = useState<PublishedRanking[]>([]);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (!user) {
      return;
    }

    if (requestedState === "loading") {
      setIsLoading(true);
      return;
    }
    if (requestedState === "error") {
      setIsLoading(false);
      setErrorMessage("シミュレーション用のエラー状態です。");
      setRankings([]);
      return;
    }
    if (requestedState === "empty") {
      setIsLoading(false);
      setErrorMessage(null);
      setRankings([]);
      return;
    }

    let canceled = false;
    setIsLoading(true);
    setErrorMessage(null);

    void apiClient
      .listPublishedRankings(user.id)
      .then((data) => {
        if (canceled) {
          return;
        }
        setRankings(data);
      })
      .catch((error: unknown) => {
        if (canceled) {
          return;
        }
        const message =
          error instanceof PublishedApiError
            ? error.message
            : "ランキング一覧の読み込みに失敗しました。";
        setErrorMessage(message);
      })
      .finally(() => {
        if (canceled) {
          return;
        }
        setIsLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [isReady, requestedState, user]);

  const groupedRankings = useMemo(() => groupRankingsByTag(rankings), [rankings]);
  const isEmpty = !isLoading && !errorMessage && rankings.length === 0;

  const headerActions = isEmpty ? null : (
    <Link
      href="/rankings/new"
      className="inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-lg bg-[#005FCC] px-5 text-sm font-bold text-white hover:bg-[#0052B0]"
    >
      <span aria-hidden="true" className="text-base leading-none">
        +
      </span>
      <span>{TEXT.newRanking}</span>
    </Link>
  );

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[0, 1].map((group) => (
            <div key={group} className="space-y-2">
              <div className="h-9 animate-pulse rounded-lg border border-[#C4CDD5] bg-[#E9EEF3]" />
              <div className="h-[84px] animate-pulse rounded-xl border border-[#C4CDD5] bg-white" />
              <div className="h-[84px] animate-pulse rounded-xl border border-[#C4CDD5] bg-white" />
            </div>
          ))}
        </div>
      );
    }

    if (errorMessage) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-base font-bold text-red-800">{TEXT.loadErrorTitle}</p>
          <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-red-300 bg-white px-4 text-sm font-semibold text-red-700"
          >
            {TEXT.reload}
          </button>
        </div>
      );
    }

    if (rankings.length === 0) {
      return (
        <div className="mx-auto w-full max-w-[880px] rounded-xl border border-[#C4CDD5] bg-white px-6 py-12 sm:px-12 sm:py-20">
          <div className="mx-auto max-w-[420px] text-center">
            <h2 className="text-2xl font-bold tracking-tight text-[#1A1A1A] sm:text-[32px]">
              {TEXT.emptyTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#55606E] sm:text-[17px]">
              {TEXT.emptyBody}
            </p>
            <div className="mt-8 space-y-3">
              <Link
                href="/rankings/new"
                className="flex h-12 items-center justify-center rounded-lg bg-[#005FCC] px-4 text-sm font-bold text-white hover:bg-[#0052B0] sm:h-14 sm:text-base"
              >
                {TEXT.createFirst}
              </Link>
              <Link
                href="/search"
                className="flex h-11 items-center justify-center rounded-lg border border-[#C4CDD5] bg-white px-4 text-sm font-bold text-[#1A1A1A] hover:bg-slate-50 sm:h-12 sm:text-base"
              >
                {TEXT.searchTags}
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {groupedRankings.map((group) => (
          <section key={group.tagId} className="space-y-1.5">
            <div className="flex h-9 items-center justify-between rounded-lg border border-[#C4CDD5] bg-[#E9EEF3] px-4">
              <p className="text-sm font-bold text-[#1A1A1A] sm:text-base">
                {TEXT.tagPrefix}: {getTagLabel(group.tagId)}
              </p>
              <span className="text-xs font-bold text-[#55606E]">{"\u25BC"}</span>
            </div>

            <ul className="space-y-1.5">
              {group.items.map((ranking) => (
                <li
                  key={ranking.id}
                  className="rounded-xl border border-[#C4CDD5] bg-white px-4 py-4 shadow-[4px_4px_0_0_#D0D7E2] sm:px-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold text-[#1A1A1A] sm:text-[20px]">
                        {ranking.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#55606E]">
                        {TEXT.tagPrefix}: {getTagLabel(ranking.tagId)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <Link
                        href={`/rankings/${ranking.id}`}
                        className="inline-flex h-8 min-w-[72px] items-center justify-center rounded-md border border-[#005FCC] bg-white px-3 text-xs font-bold text-[#005FCC]"
                      >
                        {TEXT.detail}
                      </Link>
                      <Link
                        href={`/rankings/${ranking.id}/edit`}
                        className="inline-flex h-8 min-w-[72px] items-center justify-center rounded-md bg-[#005FCC] px-3 text-xs font-bold text-white"
                      >
                        {TEXT.edit}
                      </Link>
                      <Link
                        href={`/rankings/${ranking.id}/delete`}
                        className="inline-flex h-8 min-w-[72px] items-center justify-center rounded-md border border-[#B00020] bg-white px-3 text-xs font-bold text-[#B00020]"
                      >
                        {TEXT.delete}
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }, [errorMessage, groupedRankings, isLoading, rankings.length]);

  return (
    <AppShell
      title={TEXT.title}
      subtitle={isEmpty ? TEXT.subtitleEmpty : TEXT.subtitleDefault}
      headerActions={headerActions}
    >
      {content}
    </AppShell>
  );
}

export default function RankingsPage() {
  return (
    <Suspense fallback={null}>
      <RankingsPageContent />
    </Suspense>
  );
}
