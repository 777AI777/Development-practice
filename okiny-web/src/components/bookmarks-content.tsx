"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/back-button";
import { BookmarkButton } from "@/components/bookmark-button";
import { usePageTransition } from "@/components/page-transition-provider";
import { formatSmartDate } from "@/lib/format-date";
import type { PublishedRanking } from "@/lib/types";

interface BookmarksContentProps {
  initialRankings: PublishedRanking[];
}

function EmptyBookmarksState() {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mx-auto text-muted-foreground"
      >
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      </svg>
      <p className="mt-4 text-sm text-muted-foreground">
        ブックマークはまだありません
      </p>
      <Link
        href="/rankings"
        className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90"
      >
        ランキング一覧へ
      </Link>
    </div>
  );
}

function BookmarksContentInner({ initialRankings }: BookmarksContentProps) {
  const { signalReady } = usePageTransition();
  const [rankings, setRankings] = useState(initialRankings);

  useEffect(() => {
    signalReady();
  }, [signalReady]);

  useEffect(() => {
    setRankings(initialRankings);
  }, [initialRankings]);

  return (
    <AppShell>
      <div className="mb-4 flex items-center gap-2">
        <BackButton />
        <h1 className="text-lg font-bold text-foreground">ブックマーク</h1>
      </div>

      {rankings.length === 0 ? (
        <EmptyBookmarksState />
      ) : (
        <div className="overflow-hidden rounded-xl bg-card">
          {rankings.map((ranking, idx) => (
            <Link
              key={ranking.id}
              href={`/rankings/${ranking.id}`}
              className="block transition hover:bg-muted/50"
              style={{
                borderBottom:
                  idx < rankings.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div className="p-4">
                <div className="flex items-center gap-1.5">
                  {ranking.tagName ? (
                    <span className="text-xs text-muted-foreground">
                      #{ranking.tagName}
                    </span>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    · {formatSmartDate(ranking.createdAt)}
                  </span>
                </div>
                <h3 className="mt-1.5 text-[15px] font-semibold text-foreground">
                  {ranking.title}
                </h3>
                <div className="mt-1 space-y-0">
                  {ranking.items.slice(0, 5).map((item, itemIdx) => (
                    <p
                      key={`${ranking.id}-item-${itemIdx}`}
                      className="text-sm leading-relaxed text-muted-foreground"
                    >
                      {itemIdx + 1}. {item || "未入力"}
                    </p>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {ranking.viewCount}
                  </span>
                  <BookmarkButton
                    rankingId={ranking.id}
                    initialIsBookmarked={true}
                    bookmarkCount={ranking.bookmarkCount}
                    compact
                    className="-my-1 -ml-1"
                    onChange={(nextIsBookmarked) => {
                      if (nextIsBookmarked) return;
                      setRankings((current) =>
                        current.filter((currentRanking) => currentRanking.id !== ranking.id),
                      );
                    }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="h-4" aria-hidden="true" />
    </AppShell>
  );
}

export function BookmarksContent(props: BookmarksContentProps) {
  return (
    <Suspense fallback={null}>
      <BookmarksContentInner {...props} />
    </Suspense>
  );
}
