"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { RecommendContent } from "@/components/recommend-content";
import { EmptyStateMessage } from "@/components/empty-state-message";
import { FollowingContent } from "@/components/following-content";
import { usePageTransition } from "@/components/page-transition-provider";
import { RankingCard } from "@/components/ranking-card";
import { useListCache } from "@/hooks/use-list-cache";
import type { PageResult } from "@/hooks/use-list-cache";
import { useSessionUser } from "@/hooks/use-session-user";
import { MYRANK_CACHE_KEY } from "@/lib/constants";
import type { PublishedRanking, UserProfile } from "@/lib/types";
import { buildUserProfilePath } from "@/lib/user-utils";

type TabId = "myrank" | "recommend" | "following";

const VALID_TAB_IDS: ReadonlySet<string> = new Set<TabId>(["myrank", "recommend", "following"]);

function parseTabParam(value: string | null): TabId {
  if (value !== null && VALID_TAB_IDS.has(value)) {
    return value as TabId;
  }
  return "myrank";
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "myrank", label: "マイランク", icon: "☰" },
  { id: "recommend", label: "おすすめ", icon: "★" },
  { id: "following", label: "フォロー", icon: "♥" },
];

function groupRankingsByTag(rankings: PublishedRanking[]) {
  const groups = new Map<string, { tagName: string; items: PublishedRanking[] }>();

  for (const ranking of rankings) {
    const existing = groups.get(ranking.tagId);
    if (existing) {
      existing.items.push(ranking);
      continue;
    }

    groups.set(ranking.tagId, {
      tagName: ranking.tagName ?? ranking.tagId,
      items: [ranking],
    });
  }

  return Array.from(groups.entries())
    .map(([tagId, group]) => ({ tagId, tagName: group.tagName, items: group.items }))
    .sort((a, b) => a.tagName.localeCompare(b.tagName, "ja"));
}

async function fetchMyRankings(
  cursor: string | null,
  signal: AbortSignal,
): Promise<PageResult<PublishedRanking>> {
  const res = await fetch("/api/v1/rankings", { signal });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(
      (json as { error?: { message?: string } } | null)?.error?.message ??
        "ランキングの取得に失敗しました",
    );
  }
  const json = (await res.json()) as { data: PublishedRanking[] };
  return { items: json.data, nextCursor: null };
}

function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4">
      <p className="text-base font-bold text-destructive">
        読み込みに失敗しました。
      </p>
      <p className="mt-1 text-sm text-destructive/80">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-destructive/30 bg-card px-4 text-sm font-semibold text-destructive"
        >
          再読み込み
        </button>
      ) : null}
    </div>
  );
}

function MyRankContent({
  rankings,
  errorMessage,
  collapsedTagIds,
  onToggleTag,
  onRetry,
  author,
  onAvatarClick,
  onTagClick,
}: {
  rankings: PublishedRanking[];
  errorMessage: string | null;
  collapsedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onRetry?: () => void;
  author: UserProfile;
  onAvatarClick: (author: UserProfile) => void;
  onTagClick: (tagName: string) => void;
}) {
  const groupedRankings = useMemo(() => groupRankingsByTag(rankings), [rankings]);

  if (errorMessage) {
    return <ErrorCard message={errorMessage} onRetry={onRetry} />;
  }

  if (rankings.length === 0 && !errorMessage) {
    return (
      <EmptyStateMessage
        title="ランキングがまだありません。"
        description="新しいランキングを作るか、検索から他のランキングを探せます。"
      >
        <Link
          href="/rankings/new"
          className="text-sm font-medium text-primary transition hover:underline"
        >
          新規ランキング作成
        </Link>
        <Link
          href="/search"
          className="text-sm font-medium text-primary transition hover:underline"
        >
          検索へ
        </Link>
      </EmptyStateMessage>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {groupedRankings.map((group) => {
          const isCollapsed = collapsedTagIds.includes(group.tagId);
          const panelId = `tag-panel-${group.tagId}`;

          return (
            <section key={group.tagId} className="space-y-1.5">
              <button
                type="button"
                onClick={() => onToggleTag(group.tagId)}
                aria-expanded={!isCollapsed}
                aria-controls={panelId}
                className="flex h-9 w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-muted px-4 text-left transition hover:opacity-80"
              >
                <span className="text-sm font-bold text-foreground">
                  #{group.tagName}
                </span>
                <span
                  className={`text-xs font-bold text-muted-foreground transition-transform ${
                    isCollapsed ? "-rotate-90" : "rotate-0"
                  }`}
                >
                  ▼
                </span>
              </button>

              {!isCollapsed ? (
                <div id={panelId} className="overflow-hidden rounded-xl bg-card">
                  {group.items.map((ranking, index) => (
                    <RankingCard
                      key={ranking.id}
                      ranking={{ ...ranking, author }}
                      showBorder={index < group.items.length - 1}
                      showLockIcon
                      showTagBadge
                      onAvatarClick={(_event, clickedAuthor) => {
                        onAvatarClick(clickedAuthor);
                      }}
                      onTagClick={(_event, tagName) => {
                        onTagClick(tagName);
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </>
  );
}

interface RankingsListContentProps {
  userName?: string;
  userAvatarUrl?: string;
}

function RankingsListContentInner({
  userName: serverUserName,
  userAvatarUrl: serverAvatarUrl,
}: RankingsListContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSessionUser();
  const { signalReady } = usePageTransition();

  const displayName = user?.name ?? serverUserName ?? "Unknown";
  const displayAvatarUrl = user?.avatarUrl ?? serverAvatarUrl ?? null;
  const displayUserId = user?.displayUserId ?? null;

  const {
    items: rankings,
    isLoading: isRankingsLoading,
    error: rankingsError,
    hasFetched: rankingsHasFetched,
    refresh: refreshRankings,
  } = useListCache<PublishedRanking>({
    cache: { cacheKey: MYRANK_CACHE_KEY },
    fetcher: fetchMyRankings,
    enabled: true,
    scrollRestoreKey: "scroll:rankings-list",
  });

  const [collapsedTagIds, setCollapsedTagIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    parseTabParam(searchParams.get("tab")),
  );

  const switchTab = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    const url = new URL(window.location.href);
    if (tabId === "myrank") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", tabId);
    }
    window.history.replaceState(null, "", url.toString());
  }, []);

  useEffect(() => {
    if (!isRankingsLoading) {
      signalReady();
    }
  }, [isRankingsLoading, signalReady]);

  const author: UserProfile = {
    id: user?.id ?? rankings[0]?.userId ?? "",
    displayName,
    avatarUrl: displayAvatarUrl,
    displayUserId,
    introduction: user?.introduction ?? null,
  };

  return (
    <AppShell>
      <div className={activeTab !== "myrank" ? "hidden" : undefined}>
        {isRankingsLoading && !rankingsHasFetched ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        ) : (
          <MyRankContent
            rankings={rankings}
            errorMessage={rankingsError}
            collapsedTagIds={collapsedTagIds}
            onToggleTag={(tagId) => {
              setCollapsedTagIds((current) =>
                current.includes(tagId)
                  ? current.filter((id) => id !== tagId)
                  : [...current, tagId],
              );
            }}
            onRetry={refreshRankings}
            author={author}
            onAvatarClick={(clickedAuthor) => {
              router.push(buildUserProfilePath(clickedAuthor));
            }}
            onTagClick={(tagName) => {
              router.push(`/search?q=${encodeURIComponent('#' + tagName)}&tab=rankings`);
            }}
          />
        )}
      </div>

      <div className={activeTab !== "recommend" ? "hidden" : undefined}>
        <RecommendContent
          enabled={activeTab === "recommend"}
          onAvatarClick={(clickedAuthor) => {
            router.push(buildUserProfilePath(clickedAuthor));
          }}
          onTagClick={(tagName) => {
            router.push(`/search?q=${encodeURIComponent("#" + tagName)}&tab=rankings`);
          }}
        />
      </div>

      <div className={activeTab !== "following" ? "hidden" : undefined}>
        <FollowingContent
          enabled={activeTab === "following"}
          onAvatarClick={(clickedAuthor) => {
            router.push(buildUserProfilePath(clickedAuthor));
          }}
          onTagClick={(tagName) => {
            router.push(`/search?q=${encodeURIComponent('#' + tagName)}&tab=rankings`);
          }}
        />
      </div>

      <div className="fixed bottom-[76px] left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 pointer-events-none">
        <Link
          href="/rankings/new"
          aria-label="新規ランキング作成"
          className="pointer-events-auto absolute right-4 bottom-0 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition hover:opacity-90 active:scale-95"
        >
          <span className="text-2xl font-bold leading-none text-primary-foreground">＋</span>
        </Link>
      </div>

      <nav className="fixed bottom-0 left-1/2 z-40 flex h-[60px] w-full max-w-[480px] -translate-x-1/2 rounded-t-lg border-x border-t border-border bg-card">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchTab(tab.id)}
              className="relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 bg-transparent transition"
              style={{
                color: isActive ? "var(--primary)" : "var(--muted-foreground)",
              }}
            >
              {isActive ? (
                <span className="absolute left-4 right-4 top-0 h-0.5 rounded-full bg-primary" />
              ) : null}
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>

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
