"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { FollowButton } from "@/components/follow-button";
import { usePageTransition } from "@/components/page-transition-provider";
import { RankingCard } from "@/components/ranking-card";
import { useToast } from "@/components/toast-provider";
import { useSessionUser } from "@/hooks/use-session-user";
import type {
  PublicRankingWithAuthor,
  PublishedRanking,
  UserProfileWithCounts,
} from "@/lib/types";
import { buildUserProfilePath, getUserInitial } from "@/lib/user-utils";

interface UserProfileContentProps {
  profile: UserProfileWithCounts;
  rankings: readonly PublishedRanking[];
  initialIsFollowing: boolean;
  isOwnProfile: boolean;
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

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function StatLink({
  href,
  label,
  value,
}: {
  href?: string;
  label: string;
  value: number;
}) {
  const content = (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm">
      <span className="font-semibold text-foreground">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );

  if (!href) {
    return <div>{content}</div>;
  }

  return (
    <Link
      href={href}
      className="transition hover:opacity-70"
    >
      {content}
    </Link>
  );
}

const MAX_INTRODUCTION_LENGTH = 200;

function IntroductionInlineEditor({
  currentIntroduction,
  onClose,
}: {
  currentIntroduction: string | null;
  onClose: () => void;
}) {
  const { pushToast } = useToast();
  const { updateIntroduction } = useSessionUser();
  const [value, setValue] = useState(currentIntroduction ?? "");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const normalized = value.trim();
  const isDirty = normalized !== (currentIntroduction ?? "");
  const canSave = isDirty && normalized.length <= MAX_INTRODUCTION_LENGTH;

  const handleSave = useCallback(async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const status = await updateIntroduction(normalized);
      if (status === "success") {
        pushToast({ type: "success", message: "自己紹介を更新しました。" });
        onClose();
        return;
      }
      pushToast({
        type: "error",
        message:
          status === "invalid"
            ? "自己紹介は200文字以内で入力してください。"
            : "自己紹介の更新に失敗しました。",
      });
    } finally {
      setSaving(false);
    }
  }, [canSave, saving, normalized, updateIntroduction, pushToast, onClose]);

  return (
    <div className="mt-3 w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={MAX_INTRODUCTION_LENGTH}
        rows={3}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="自己紹介を入力（例：好きなものや最近ハマっていることなど）"
      />
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {value.length}/{MAX_INTRODUCTION_LENGTH}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition disabled:opacity-60"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserProfileContentInner({
  profile,
  rankings,
  initialIsFollowing,
  isOwnProfile,
}: UserProfileContentProps) {
  const router = useRouter();
  const { signalReady } = usePageTransition();
  const { user } = useSessionUser();
  const impressionSentRef = useRef(false);
  const [followerCount, setFollowerCount] = useState(profile.followerCount);
  const [editingIntroduction, setEditingIntroduction] = useState(false);

  // ローカル表示用: ユーザーメタデータが更新されたら即反映
  const displayIntroduction = isOwnProfile
    ? (user?.introduction ?? profile.introduction)
    : profile.introduction;

  useEffect(() => {
    signalReady();
  }, [signalReady]);

  useEffect(() => {
    setFollowerCount(profile.followerCount);
  }, [profile.followerCount]);

  useEffect(() => {
    if (impressionSentRef.current || rankings.length === 0) {
      return;
    }
    if (!user || user.id === profile.id) {
      return;
    }

    impressionSentRef.current = true;

    void fetch("/api/v1/rankings/impressions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rankingIds: rankings.map((ranking) => ranking.id),
      }),
    }).catch(() => {});
  }, [profile.id, rankings, user]);

  const profilePath = buildUserProfilePath(profile);
  const rankingCards: PublicRankingWithAuthor[] = rankings.map((ranking) => ({
    ...ranking,
    author: profile,
  }));

  return (
    <AppShell>
      <div className="mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <BackArrowIcon />
          <span>戻る</span>
        </button>
      </div>

      <section className="mb-6 rounded-2xl border border-border bg-card px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={`${profile.displayName}のアバター`}
                width={72}
                height={72}
                className="h-[72px] w-[72px] shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {getUserInitial(profile.displayName, "?")}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-foreground">
                {profile.displayName}
              </h1>
              {profile.displayUserId ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  @{profile.displayUserId}
                </p>
              ) : null}
            </div>
          </div>

          {!isOwnProfile ? (
            <FollowButton
              userId={profile.id}
              initialIsFollowing={initialIsFollowing}
              onChange={(nextIsFollowing) => {
                setFollowerCount((current) =>
                  nextIsFollowing ? current + 1 : Math.max(0, current - 1),
                );
              }}
            />
          ) : null}
        </div>

        {/* 自己紹介セクション */}
        {editingIntroduction ? (
          <IntroductionInlineEditor
            currentIntroduction={displayIntroduction}
            onClose={() => setEditingIntroduction(false)}
          />
        ) : (
          <div className="mt-4">
            {displayIntroduction ? (
              <div className="flex items-start gap-2">
                <p className="min-w-0 flex-1 text-sm text-muted-foreground whitespace-pre-line">
                  {displayIntroduction}
                </p>
                {isOwnProfile ? (
                  <button
                    type="button"
                    onClick={() => setEditingIntroduction(true)}
                    className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    aria-label="自己紹介を編集"
                  >
                    <PencilIcon />
                  </button>
                ) : null}
              </div>
            ) : isOwnProfile ? (
              <button
                type="button"
                onClick={() => setEditingIntroduction(true)}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <PencilIcon />
                <span>自己紹介を追加</span>
              </button>
            ) : null}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
          <StatLink label="公開ランキング" value={rankings.length} />
          <StatLink
            href={`${profilePath}/following`}
            label="フォロー中"
            value={profile.followingCount}
          />
          <StatLink
            href={`${profilePath}/followers`}
            label="フォロワー"
            value={followerCount}
          />
        </div>
      </section>

      {rankingCards.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            公開ランキングはまだありません。
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card">
          {rankingCards.map((ranking, index) => (
            <RankingCard
              key={ranking.id}
              ranking={ranking}
              showBorder={index < rankingCards.length - 1}
              showTagBadge
              onAvatarClick={(_event, author) => {
                router.push(buildUserProfilePath(author));
              }}
            />
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

