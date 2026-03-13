"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { ComingSoon } from "@/components/coming-soon";
import { useSessionUser } from "@/hooks/use-session-user";
import { formatSmartDate } from "@/lib/format-date";
import {
  HttpPublishedApiClient,
  PublishedApiError,
} from "@/lib/publish/http-published-api-client";
import { FIXED_TAGS } from "@/lib/tags";
import type { PublishedRanking } from "@/lib/types";

const apiClient = new HttpPublishedApiClient();
const TAG_ORDER = FIXED_TAGS.map((tag) => tag.id);

type TabId = "myrank" | "recommend" | "following";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "myrank", label: "マイランク", icon: "\u2630" },
  { id: "recommend", label: "おすすめ", icon: "\u2605" },
  { id: "following", label: "フォロー中", icon: "\u2665" },
];

const TAG_LABELS_JA: Record<string, string> = {
  movie: "映画",
  music: "音楽",
  travel: "旅行",
  cafe: "カフェ",
  cosmetics: "化粧品",
  daily: "日用品",
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
  const [collapsedTagIds, setCollapsedTagIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("myrank");

  const toggleTagAccordion = useCallback((tagId: string) => {
    setCollapsedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }, []);

  useLayoutEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);
    setRankings([]);
  }, [requestedState, user?.id]);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (!user) {
      return;
    }

    if (requestedState === "loading") {
      return;
    }
    if (requestedState === "error") {
      setIsLoading(false);
      setErrorMessage("シミュレーション用のエラー状態です。");
      return;
    }
    if (requestedState === "empty") {
      setIsLoading(false);
      setErrorMessage(null);
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

  const userInitial = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

  const renderMyRankContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[0, 1].map((group) => (
            <div key={group} className="space-y-2">
              <div className="h-9 animate-pulse rounded-lg border border-border bg-muted" />
              <div className="h-[84px] animate-pulse rounded-xl border border-border bg-card" />
              <div className="h-[84px] animate-pulse rounded-xl border border-border bg-card" />
            </div>
          ))}
        </div>
      );
    }

    if (errorMessage) {
      return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4">
          <p className="text-base font-bold text-destructive">
            ランキングの読み込みに失敗しました。
          </p>
          <p className="mt-1 text-sm text-destructive/80">{errorMessage}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-destructive/30 bg-card px-4 text-sm font-semibold text-destructive"
          >
            再読み込み
          </button>
        </div>
      );
    }

    if (isEmpty) {
      return (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <h2 className="text-2xl font-bold text-foreground">
            ランキングがまだありません
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            新規作成から、あなたの好きなものを登録できます。
          </p>
          <div className="mt-8 space-y-3">
            <Link
              href="/rankings/new"
              className="flex h-12 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              新規ランキング作成
            </Link>
            <Link
              href="/search"
              className="flex h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-bold text-foreground hover:bg-muted"
            >
              タグ検索へ
            </Link>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="mb-4 flex justify-end">
          <Link
            href="/rankings/new"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            ＋ 新規ランキング
          </Link>
        </div>

        <div className="space-y-3">
          {groupedRankings.map((group) => {
            const isCollapsed = collapsedTagIds.includes(group.tagId);
            const panelId = `tag-panel-${group.tagId}`;

            return (
              <section key={group.tagId} className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => toggleTagAccordion(group.tagId)}
                  aria-expanded={!isCollapsed}
                  aria-controls={panelId}
                  className="flex h-9 w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-muted px-4 text-left transition hover:opacity-80"
                >
                  <span className="text-sm font-bold text-foreground">
                    {getTagLabel(group.tagId)}
                  </span>
                  <span
                    className={`text-xs font-bold text-muted-foreground transition-transform ${isCollapsed ? "-rotate-90" : "rotate-0"}`}
                  >
                    {"\u25BC"}
                  </span>
                </button>

                <div
                  id={panelId}
                  className={`${isCollapsed ? "hidden" : ""}`}
                >
                  <div className="overflow-hidden rounded-xl" style={{ backgroundColor: "var(--card)" }}>
                    {group.items.map((ranking, idx) => (
                      <Link
                        key={ranking.id}
                        href={`/rankings/${ranking.id}`}
                        className="block transition hover:bg-muted/50"
                        style={{ borderBottom: idx < group.items.length - 1 ? "1px solid var(--border)" : "none" }}
                      >
                        <div className="p-4 flex gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {userInitial}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-foreground" style={{ color: "var(--foreground)" }}>
                                {user?.name ?? "Unknown"}
                              </span>
                              <span className="text-xs text-muted-foreground" style={{ color: "var(--muted-foreground)" }}>
                                · {formatSmartDate(ranking.createdAt)}
                              </span>
                            </div>
                            <h3 className="font-semibold text-[15px]" style={{ color: "var(--foreground)" }}>
                              {ranking.title}
                            </h3>
                            <div className="space-y-0">
                              {ranking.items.slice(0, 5).map((item, itemIdx) => (
                                <p
                                  key={`${ranking.id}-item-${itemIdx}`}
                                  className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}
                                >
                                  {itemIdx + 1}. {item || "未入力"}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <AppShell>
      {/* Tab content */}
      {activeTab === "myrank" && renderMyRankContent()}

      {activeTab === "recommend" && (
        <ComingSoon
          title="おすすめ"
          description="おすすめランキングは現在開発中です"
        />
      )}

      {activeTab === "following" && (
        <ComingSoon
          title="フォロー中"
          description="フォロー機能は現在開発中です"
        />
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-1/2 z-40 flex h-[60px] w-full max-w-[480px] -translate-x-1/2 rounded-t-lg border-t border-l border-r border-border bg-card">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 bg-transparent transition"
              style={{
                color: isActive
                  ? "var(--primary)"
                  : "var(--muted-foreground)",
              }}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-4 right-4 h-0.5 rounded-full"
                  style={{ backgroundColor: "var(--primary)" }}
                />
              )}
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom bar spacer */}
      <div className="h-[60px]" aria-hidden="true" />
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
