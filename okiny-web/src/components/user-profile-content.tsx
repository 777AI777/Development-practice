"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { AppShell } from "@/components/app-shell";
import { usePageTransition } from "@/components/page-transition-provider";
import { RankingCard } from "@/components/ranking-card";
import { useSessionUser } from "@/hooks/use-session-user";
import { HttpPublishedApiClient } from "@/lib/publish/http-published-api-client";
import type { PublicRankingWithAuthor } from "@/lib/types";
import { getUserInitial } from "@/lib/user-utils";

const apiClient = new HttpPublishedApiClient();

interface UserProfileData {
  readonly id: string;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly displayUserId: string | null;
}

interface PublicRankingItem {
  readonly id: string;
  readonly title: string;
  readonly tagName: string;
  readonly items: readonly string[];
  readonly createdAt: string;
  readonly viewCount: number;
  readonly impressionCount: number;
  readonly bookmarkCount: number;
}

interface UserProfileContentProps {
  profile: UserProfileData;
  rankings: readonly PublicRankingItem[];
}

function BackArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function UserProfileContentInner({ profile, rankings }: UserProfileContentProps) {
  const router = useRouter();
  const { signalReady } = usePageTransition();
  const { user } = useSessionUser();

  useEffect(() => {
    signalReady();
  }, [signalReady]);

  // インプレッション記録（自分のプロフィールでは発火しない）
  const impressionSentRef = useRef(false);
  useEffect(() => {
    if (impressionSentRef.current || rankings.length === 0) return;
    // ユーザー情報のロードを待つ（未ロード時はスキップ）
    if (!user) return;
    // 自分のプロフィールページの場合はスキップ
    if (user.id === profile.id) return;
    impressionSentRef.current = true;
    const ids = rankings.map((r) => r.id);
    apiClient.recordImpressions(ids).catch(() => {});
  }, [user, profile.id, rankings]);

  return (
    <AppShell>
      <div className="mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-transparent px-2 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <BackArrowIcon />
          <span>戻る</span>
        </button>
      </div>

      <section className="mb-6 rounded-xl border border-border bg-card px-6 py-6">
        <div className="flex items-center gap-4">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={`${profile.displayName}のアバター`}
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {getUserInitial(profile.displayName, "?")}
            </div>
          )}

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-foreground">
              {profile.displayName}
            </h1>
            {profile.displayUserId ? (
              <p className="mt-0.5 text-sm text-muted-foreground">
                @{profile.displayUserId}
              </p>
            ) : null}
            <p className="mt-0.5 text-sm text-muted-foreground">
              公開ランキング {rankings.length}件
            </p>
          </div>
        </div>
      </section>

      {rankings.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            公開ランキングはまだありません
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-card">
          {rankings.map((ranking, idx) => {
            const rankingWithAuthor: PublicRankingWithAuthor = {
              id: ranking.id,
              userId: profile.id,
              title: ranking.title,
              tagId: "",
              tagName: ranking.tagName,
              items: [...ranking.items] as [string, string, string, string, string],
              isPublic: true,
              createdAt: ranking.createdAt,
              updatedAt: ranking.createdAt,
              viewCount: ranking.viewCount,
              impressionCount: ranking.impressionCount,
              bookmarkCount: ranking.bookmarkCount,
              isBookmarked: false,
              author: profile,
            };
            return (
              <RankingCard
                key={ranking.id}
                ranking={rankingWithAuthor}
                showBorder={idx < rankings.length - 1}
                showTagBadge
              />
            );
          })}
        </div>
      )}

      <div className="h-4" aria-hidden="true" />
    </AppShell>
  );
}

export function UserProfileContent(props: UserProfileContentProps) {
  return (
    <Suspense fallback={null}>
      <UserProfileContentInner {...props} />
    </Suspense>
  );
}
