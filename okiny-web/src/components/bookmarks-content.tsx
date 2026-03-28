"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/back-button";
import { EmptyStateMessage } from "@/components/empty-state-message";
import { usePageTransition } from "@/components/page-transition-provider";
import { RankingCard } from "@/components/ranking-card";
import { useListCache } from "@/hooks/use-list-cache";
import type { PageResult } from "@/hooks/use-list-cache";
import { BOOKMARKS_CACHE_KEY, SCROLL_KEY_BOOKMARKS } from "@/lib/constants";
import { clearListCache } from "@/lib/list-cache";
import type { PublicRankingWithAuthor } from "@/lib/types";
import { buildUserProfilePath } from "@/lib/user-utils";

async function fetchBookmarks(
  cursor: string | null,
  signal: AbortSignal,
): Promise<PageResult<PublicRankingWithAuthor>> {
  void cursor;

  const res = await fetch("/api/v1/bookmarks", { signal });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(
      (json as { error?: { message?: string } } | null)?.error?.message ??
        "ブックマークの取得に失敗しました。",
    );
  }

  const json = (await res.json()) as { data: PublicRankingWithAuthor[] };
  return { items: json.data, nextCursor: null };
}

function EmptyBookmarksState() {
  return (
    <EmptyStateMessage title="ブックマークはまだありません。">
      <Link
        href="/rankings"
        className="text-sm font-medium text-primary transition hover:underline"
      >
        ランキング一覧を見る
      </Link>
    </EmptyStateMessage>
  );
}

function BookmarksContentInner() {
  const router = useRouter();
  const { signalReady } = usePageTransition();

  const {
    items: bookmarkedRankings,
    isLoading,
    error,
    hasFetched,
    refresh,
  } = useListCache<PublicRankingWithAuthor>({
    cache: { cacheKey: BOOKMARKS_CACHE_KEY },
    fetcher: fetchBookmarks,
    enabled: true,
    scrollRestoreKey: SCROLL_KEY_BOOKMARKS,
  });

  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const rankings = useMemo(
    () => bookmarkedRankings.filter((ranking) => !hiddenIds.has(ranking.id)),
    [bookmarkedRankings, hiddenIds],
  );

  useEffect(() => {
    setHiddenIds(new Set());
  }, [bookmarkedRankings]);

  useEffect(() => {
    if (!isLoading) {
      signalReady();
    }
  }, [isLoading, signalReady]);

  if (error) {
    return (
      <AppShell>
        <div className="mb-4 flex items-center gap-2">
          <BackButton />
          <h1 className="text-lg font-bold text-foreground">ブックマーク</h1>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4">
          <p className="text-base font-bold text-destructive">
            読み込みに失敗しました。
          </p>
          <p className="mt-1 text-sm text-destructive/80">{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-destructive/30 bg-card px-4 text-sm font-semibold text-destructive"
          >
            再読み込み
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-4 flex items-center gap-2">
        <BackButton />
        <h1 className="text-lg font-bold text-foreground">ブックマーク</h1>
      </div>

      {hasFetched && !isLoading && rankings.length === 0 ? (
        <EmptyBookmarksState />
      ) : (
        <div className="overflow-hidden rounded-xl bg-card">
          {rankings.map((ranking, index) => (
            <RankingCard
              key={ranking.id}
              ranking={ranking}
              showBorder={index < rankings.length - 1}
              showTagBadge
              showBookmark
              onAvatarClick={(_event, author) => {
                router.push(buildUserProfilePath(author));
              }}
              onTagClick={(_event, tagName) => {
                router.push(`/search?q=${encodeURIComponent(`#${tagName}`)}&tab=rankings`);
              }}
              onBookmarkChange={(nextIsBookmarked) => {
                if (nextIsBookmarked) {
                  return;
                }

                setHiddenIds((prev) => new Set([...prev, ranking.id]));
                clearListCache({ cacheKey: BOOKMARKS_CACHE_KEY });
              }}
            />
          ))}
        </div>
      )}

      <div className="h-4" aria-hidden="true" />
    </AppShell>
  );
}

export function BookmarksContent() {
  return (
    <Suspense fallback={null}>
      <BookmarksContentInner />
    </Suspense>
  );
}
