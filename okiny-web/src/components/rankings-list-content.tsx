"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { ComingSoon } from "@/components/coming-soon";
import { usePageTransition } from "@/components/page-transition-provider";
import { useSessionUser } from "@/hooks/use-session-user";
import { formatSmartDate } from "@/lib/format-date";
import { getUserInitial } from "@/lib/user-utils";
import type { PublishedRanking } from "@/lib/types";

type TabId = "myrank" | "recommend" | "following";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "myrank", label: "\u30DE\u30A4\u30E9\u30F3\u30AF", icon: "\u2630" },
  { id: "recommend", label: "\u304A\u3059\u3059\u3081", icon: "\u2605" },
  { id: "following", label: "\u30D5\u30A9\u30ED\u30FC\u4E2D", icon: "\u2665" },
];

function groupRankingsByTag(rankings: PublishedRanking[]) {
  const groups = new Map<string, { tagName: string; items: PublishedRanking[] }>();

  for (const ranking of rankings) {
    const existing = groups.get(ranking.tagId);
    if (existing) {
      groups.set(ranking.tagId, { ...existing, items: [...existing.items, ranking] });
    } else {
      groups.set(ranking.tagId, {
        tagName: ranking.tagName ?? ranking.tagId,
        items: [ranking],
      });
    }
  }

  return Array.from(groups.entries())
    .map(([tagId, group]) => ({ tagId, tagName: group.tagName, items: group.items }))
    .sort((a, b) => a.tagId.localeCompare(b.tagId));
}

function MyRankContent({
  isLoading,
  errorMessage,
  isEmpty,
  groupedRankings,
  collapsedTagIds,
  toggleTagAccordion,
  userName,
}: {
  isLoading: boolean;
  errorMessage: string | null;
  isEmpty: boolean;
  groupedRankings: { tagId: string; tagName: string; items: PublishedRanking[] }[];
  collapsedTagIds: string[];
  toggleTagAccordion: (tagId: string) => void;
  userName: string | undefined;
}) {
  const userInitial = getUserInitial(userName, "??");

  if (isLoading) {
    return null;
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
          aria-label="新規ランキング作成"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-2.5 py-1 text-sm font-bold text-primary-foreground hover:opacity-90"
        >
＋
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
                  {group.tagName}
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
                <div className="overflow-hidden rounded-xl bg-card">
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
                            <span className="text-sm font-bold text-foreground">
                              {userName ?? "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              · {formatSmartDate(ranking.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-[15px] text-foreground">
                              {ranking.title}
                            </h3>
                            {ranking.isPublic === false && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="非公開">
                                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="space-y-0">
                            {ranking.items.slice(0, 5).map((item, itemIdx) => (
                              <p
                                key={`${ranking.id}-item-${itemIdx}`}
                                className="text-sm leading-relaxed text-muted-foreground"
                              >
                                {itemIdx + 1}. {item || "未入力"}
                              </p>
                            ))}
                          </div>
                          {/* インプレッション */}
                          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              {ranking.viewCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                              </svg>
                              {ranking.bookmarkCount}
                            </span>
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
}

interface RankingsListContentProps {
  initialRankings: PublishedRanking[];
  userName?: string;
}

function RankingsListContentInner({ initialRankings, userName: serverUserName }: RankingsListContentProps) {
  const { user } = useSessionUser();
  const { signalReady } = usePageTransition();

  const displayName = user?.name ?? serverUserName;

  const [rankings, setRankings] = useState<PublishedRanking[]>(initialRankings);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [collapsedTagIds, setCollapsedTagIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("myrank");

  const toggleTagAccordion = useCallback((tagId: string) => {
    setCollapsedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }, []);

  // データは SSR 済みなのでマウント時に即 signalReady
  useEffect(() => {
    signalReady();
  }, [signalReady]);

  const groupedRankings = useMemo(() => groupRankingsByTag(rankings), [rankings]);
  const isEmpty = !isLoading && !errorMessage && rankings.length === 0;

  return (
    <AppShell>
      {/* Tab content */}
      {activeTab === "myrank" && (
        <MyRankContent
          isLoading={isLoading}
          errorMessage={errorMessage}
          isEmpty={isEmpty}
          groupedRankings={groupedRankings}
          collapsedTagIds={collapsedTagIds}
          toggleTagAccordion={toggleTagAccordion}
          userName={displayName}
        />
      )}

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
                  className="absolute top-0 left-4 right-4 h-0.5 rounded-full bg-primary"
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

export function RankingsListContent(props: RankingsListContentProps) {
  return (
    <Suspense fallback={null}>
      <RankingsListContentInner {...props} />
    </Suspense>
  );
}
