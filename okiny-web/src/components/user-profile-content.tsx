"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { formatSmartDate } from "@/lib/format-date";

/** サーバーから受け取るプロフィール情報 */
interface UserProfileData {
  readonly id: string;
  readonly displayName: string;
  readonly avatarUrl: string | null;
}

/** サーバーから受け取る公開ランキング */
interface PublicRankingItem {
  readonly id: string;
  readonly title: string;
  readonly tagName: string;
  readonly items: readonly string[];
  readonly createdAt: string;
  readonly viewCount: number;
  readonly bookmarkCount: number;
}

interface UserProfileContentProps {
  profile: UserProfileData;
  rankings: readonly PublicRankingItem[];
}

/** ユーザーアバターの頭文字を取得 */
function getInitial(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
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

  return (
    <AppShell>
      {/* 戻るボタン */}
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

      {/* プロフィールヘッダー */}
      <section className="mb-6 rounded-xl border border-border bg-card px-6 py-6">
        <div className="flex items-center gap-4">
          {/* アバター */}
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={`${profile.displayName}のアバター`}
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {getInitial(profile.displayName)}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-foreground">
              {profile.displayName}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              公開ランキング {rankings.length}件
            </p>
          </div>
        </div>
      </section>

      {/* ランキング一覧 */}
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
              <div className="p-4">
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {ranking.tagName}
                  </span>
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
                {/* 閲覧数・ブックマーク数 */}
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {ranking.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                    </svg>
                    {ranking.bookmarkCount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Bottom spacer（AppShellのボトムバー分） */}
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
