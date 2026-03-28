"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { ComingSoon } from "@/components/coming-soon";
import { usePageTransition } from "@/components/page-transition-provider";
import { RankingCard } from "@/components/ranking-card";
import { useSessionUser } from "@/hooks/use-session-user";
import type {
  PublicRankingWithAuthor,
  PublishedRanking,
  UserProfile,
} from "@/lib/types";
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
      <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
        <h2 className="text-2xl font-bold text-foreground">
          ランキングがまだありません
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          新しいランキングを作るか、検索から他のランキングを探せます。
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
            検索へ
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

function FollowingContent({
  isLoading,
  errorMessage,
  rankings,
  onRetry,
  onAvatarClick,
  onTagClick,
}: {
  isLoading: boolean;
  errorMessage: string | null;
  rankings: PublicRankingWithAuthor[];
  onRetry: () => void;
  onAvatarClick: (author: UserProfile) => void;
  onTagClick: (tagName: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (errorMessage) {
    return <ErrorCard message={errorMessage} onRetry={onRetry} />;
  }

  if (rankings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
        <h2 className="text-2xl font-bold text-foreground">
          フォローの公開ランキングはまだありません
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          気になるユーザーをフォローすると、ここに公開ランキングが並びます。
        </p>
        <Link
          href="/search"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-bold text-foreground hover:bg-muted"
        >
          ユーザーを探す
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card">
      {rankings.map((ranking, index) => (
        <RankingCard
          key={ranking.id}
          ranking={ranking}
          showBorder={index < rankings.length - 1}
          showTagBadge
          showBookmark
          onAvatarClick={(_event, author) => {
            onAvatarClick(author);
          }}
          onTagClick={(_event, tagName) => {
            onTagClick(tagName);
          }}
        />
      ))}
    </div>
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
  const [followingRankings, setFollowingRankings] = useState<
    PublicRankingWithAuthor[]
  >([]);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [followingError, setFollowingError] = useState<string | null>(null);
  const [hasLoadedFollowing, setHasLoadedFollowing] = useState(false);
  const [followingReloadKey, setFollowingReloadKey] = useState(0);

  useEffect(() => {
    signalReady();
  }, [signalReady]);

  useEffect(() => {
    if (activeTab !== "following" || hasLoadedFollowing || isFollowingLoading) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    async function loadFollowingRankings() {
      setIsFollowingLoading(true);
      setFollowingError(null);

      try {
        const response = await fetch("/api/v1/rankings/following", {
          cache: "no-store",
          signal: controller.signal,
        });
        const body = (await response.json().catch(() => ({}))) as {
          data?: PublicRankingWithAuthor[];
          error?: { message?: string };
        };

        if (!response.ok || !body.data) {
          throw new Error(
            body.error?.message ?? "フォローランキングの読み込みに失敗しました。",
          );
        }

        if (cancelled) {
          return;
        }

        setFollowingRankings(body.data);
        setHasLoadedFollowing(true);
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }

        setFollowingError(
          error instanceof Error
            ? error.message
            : "フォローランキングの読み込みに失敗しました。",
        );
      } finally {
        if (!cancelled) {
          setIsFollowingLoading(false);
        }
      }
    }

    void loadFollowingRankings();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [activeTab, followingReloadKey, hasLoadedFollowing, isFollowingLoading]);

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
          isLoading={isFollowingLoading}
          errorMessage={followingError}
          rankings={followingRankings}
          onRetry={() => {
            setHasLoadedFollowing(false);
            setFollowingError(null);
            setFollowingReloadKey((current) => current + 1);
          }}
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
