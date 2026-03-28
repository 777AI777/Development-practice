"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { AppShell } from "@/components/app-shell";
import { usePageTransition } from "@/components/page-transition-provider";
import { useSessionUser } from "@/hooks/use-session-user";
import { formatSmartDate } from "@/lib/format-date";
import { HttpPublishedApiClient } from "@/lib/publish/http-published-api-client";
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
          {rankings.map((ranking, idx) => (
            <Link
              key={ranking.id}
              href={`/rankings/${ranking.id}`}
              className="block transition hover:bg-muted/50"
              style={{
                borderBottom:
                  idx < rankings.length - 1
                    ? "1px solid var(--border)"
                    : "none",
              }}
            >
              <div className="p-4 flex gap-3">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {getUserInitial(profile.displayName, "?")}
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-foreground">
                      {profile.displayName}
                    </span>
                    {profile.displayUserId ? (
                      <span className="text-xs text-muted-foreground">
                        @{profile.displayUserId}
                      </span>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      · {formatSmartDate(ranking.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[15px] font-semibold text-foreground">
                      {ranking.title}
                    </h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {ranking.tagName}
                    </span>
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
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
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
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                      {ranking.impressionCount}
                    </span>
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
                        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                      </svg>
                      {ranking.bookmarkCount}
                    </span>
                  </div>
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

export function UserProfileContent(props: UserProfileContentProps) {
  return (
    <Suspense fallback={null}>
      <UserProfileContentInner {...props} />
    </Suspense>
  );
}
