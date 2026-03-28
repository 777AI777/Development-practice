"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { ComingSoon } from "@/components/coming-soon";
import { EmptyStateMessage } from "@/components/empty-state-message";
import { FollowingContent } from "@/components/following-content";
import { usePageTransition } from "@/components/page-transition-provider";
import { RankingCard } from "@/components/ranking-card";
import { useSessionUser } from "@/hooks/use-session-user";
import type { PublishedRanking, UserProfile } from "@/lib/types";
import { buildUserProfilePath } from "@/lib/user-utils";

type TabId = "myrank" | "recommend" | "following";

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
  author,
  onAvatarClick,
  onTagClick,
}: {
  rankings: PublishedRanking[];
  errorMessage: string | null;
  collapsedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  author: UserProfile;
  onAvatarClick: (author: UserProfile) => void;
  onTagClick: (tagName: string) => void;
}) {
  const groupedRankings = useMemo(() => groupRankingsByTag(rankings), [rankings]);

  if (errorMessage) {
    return <ErrorCard message={errorMessage} />;
  }

  if (rankings.length === 0) {
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
  initialRankings: PublishedRanking[];
  userName?: string;
  userAvatarUrl?: string;
}

function RankingsListContentInner({
  initialRankings,
  userName: serverUserName,
  userAvatarUrl: serverAvatarUrl,
}: RankingsListContentProps) {
  const router = useRouter();
  const { user } = useSessionUser();
  const { signalReady } = usePageTransition();

  const displayName = user?.name ?? serverUserName ?? "Unknown";
  const displayAvatarUrl = user?.avatarUrl ?? serverAvatarUrl ?? null;
  const displayUserId = user?.displayUserId ?? null;

  const [rankings] = useState<PublishedRanking[]>(initialRankings);
  const [errorMessage] = useState<string | null>(null);
  const [collapsedTagIds, setCollapsedTagIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("myrank");

  useEffect(() => {
    signalReady();
  }, [signalReady]);

  const author: UserProfile = {
    id: user?.id ?? rankings[0]?.userId ?? "",
    displayName,
    avatarUrl: displayAvatarUrl,
    displayUserId,
    introduction: user?.introduction ?? null,
  };

  return (
    <AppShell>
      {activeTab === "myrank" ? (
        <MyRankContent
          rankings={rankings}
          errorMessage={errorMessage}
          collapsedTagIds={collapsedTagIds}
          onToggleTag={(tagId) => {
            setCollapsedTagIds((current) =>
              current.includes(tagId)
                ? current.filter((id) => id !== tagId)
                : [...current, tagId],
            );
          }}
          author={author}
          onAvatarClick={(clickedAuthor) => {
            router.push(buildUserProfilePath(clickedAuthor));
          }}
          onTagClick={(tagName) => {
            router.push(`/search?q=${encodeURIComponent('#' + tagName)}&tab=rankings`);
          }}
        />
      ) : null}

      {activeTab === "recommend" ? (
        <ComingSoon
          title="おすすめ"
          description="おすすめランキングは現在準備中です。"
        />
      ) : null}

      {activeTab === "following" ? (
        <FollowingContent
          onAvatarClick={(clickedAuthor) => {
            router.push(buildUserProfilePath(clickedAuthor));
          }}
          onTagClick={(tagName) => {
            router.push(`/search?q=${encodeURIComponent('#' + tagName)}&tab=rankings`);
          }}
        />
      ) : null}

      <nav className="fixed bottom-0 left-1/2 z-40 flex h-[60px] w-full max-w-[480px] -translate-x-1/2 rounded-t-lg border-x border-t border-border bg-card">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
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
