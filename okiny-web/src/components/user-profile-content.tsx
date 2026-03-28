"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/back-button";
import { FollowButton } from "@/components/follow-button";
import { usePageTransition } from "@/components/page-transition-provider";
import { RankingCard } from "@/components/ranking-card";
import { useToast } from "@/components/toast-provider";
import { useDisplayUserIdCheck } from "@/hooks/use-display-user-id-check";
import { useSessionUser } from "@/hooks/use-session-user";
import type {
  PublicRankingWithAuthor,
  PublishedRanking,
  UserProfileWithCounts,
} from "@/lib/types";
import {
  buildUserProfilePath,
  DISPLAY_USER_ID_MAX_LENGTH,
  getUserInitial,
  normalizeDisplayUserId,
} from "@/lib/user-utils";

interface UserProfileContentProps {
  profile: UserProfileWithCounts;
  rankings: readonly PublishedRanking[];
  initialIsFollowing: boolean;
  isOwnProfile: boolean;
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

function MoreVerticalIcon() {
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
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
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
const MAX_DISPLAY_NAME_LENGTH = 30;

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

function ProfileEditForm({ onClose }: { onClose: () => void }) {
  const { pushToast } = useToast();
  const { user, updateDisplayName, updateDisplayUserId, updateIntroduction } =
    useSessionUser();

  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [displayUserId, setDisplayUserId] = useState(
    user?.displayUserId ?? "",
  );
  const [introduction, setIntroduction] = useState(user?.introduction ?? "");
  const [saving, setSaving] = useState(false);

  const normalizedDisplayUserId = normalizeDisplayUserId(displayUserId);
  const isUserIdDirty = normalizedDisplayUserId !== (user?.displayUserId ?? "");
  const checkValue = isUserIdDirty ? normalizedDisplayUserId : "";
  const { status: availabilityStatus } = useDisplayUserIdCheck(checkValue);

  const isNameDirty = displayName.trim() !== (user?.name ?? "");
  const normalizedIntroduction = introduction.trim();
  const isIntroDirty = normalizedIntroduction !== (user?.introduction ?? "");

  const hasChanges = isNameDirty || isUserIdDirty || isIntroDirty;

  const nameValid = displayName.trim().length > 0;
  const userIdValid =
    !isUserIdDirty ||
    (normalizedDisplayUserId.length > 0 &&
      availabilityStatus === "available");
  const introValid = normalizedIntroduction.length <= 200;

  const canSave = hasChanges && nameValid && userIdValid && introValid && !saving;

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);

    try {
      const results: string[] = [];

      if (isNameDirty) {
        const status = await updateDisplayName(displayName.trim());
        if (status !== "success") {
          pushToast({
            type: "error",
            message:
              status === "invalid"
                ? "表示名は1〜30文字で入力してください。"
                : "表示名の更新に失敗しました。",
          });
          return;
        }
        results.push("表示名");
      }

      if (isUserIdDirty) {
        const status = await updateDisplayUserId(normalizedDisplayUserId);
        if (status !== "success") {
          pushToast({
            type: "error",
            message:
              status === "conflict"
                ? "そのユーザーIDはすでに使われています。"
                : status === "invalid"
                  ? "ユーザーIDは3〜20文字の英小文字・数字・_で入力してください。"
                  : "ユーザーIDの更新に失敗しました。",
          });
          return;
        }
        results.push("ユーザーID");
      }

      if (isIntroDirty) {
        const status = await updateIntroduction(normalizedIntroduction);
        if (status !== "success") {
          pushToast({
            type: "error",
            message:
              status === "invalid"
                ? "自己紹介は200文字以内で入力してください。"
                : "自己紹介の更新に失敗しました。",
          });
          return;
        }
        results.push("自己紹介");
      }

      pushToast({
        type: "success",
        message: `${results.join("・")}を更新しました。`,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }, [
    canSave,
    isNameDirty,
    isUserIdDirty,
    isIntroDirty,
    displayName,
    normalizedDisplayUserId,
    normalizedIntroduction,
    updateDisplayName,
    updateDisplayUserId,
    updateIntroduction,
    pushToast,
    onClose,
  ]);

  return (
    <div className="border-b border-border px-4 py-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">プロフィール編集</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="閉じる"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {/* 表示名 */}
        <div>
          <label
            htmlFor="profile-edit-name"
            className="mb-1 block text-xs font-semibold text-muted-foreground"
          >
            表示名
          </label>
          <input
            id="profile-edit-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="表示名を入力"
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {displayName.length}/{MAX_DISPLAY_NAME_LENGTH}
          </p>
        </div>

        {/* ユーザーID */}
        <div>
          <label
            htmlFor="profile-edit-user-id"
            className="mb-1 block text-xs font-semibold text-muted-foreground"
          >
            ユーザーID
          </label>
          <div className="flex items-center rounded-md border border-border bg-background px-3">
            <span className="text-sm text-muted-foreground">@</span>
            <input
              id="profile-edit-user-id"
              value={displayUserId}
              onChange={(e) => setDisplayUserId(e.target.value)}
              maxLength={DISPLAY_USER_ID_MAX_LENGTH}
              className="w-full bg-transparent px-1 py-2 text-sm text-foreground focus:outline-none"
              placeholder="okiny_user"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <div className="mt-1 flex items-center justify-between">
            <div>
              {availabilityStatus === "checking" && (
                <span className="text-xs text-muted-foreground">確認中...</span>
              )}
              {availabilityStatus === "available" && (
                <span className="text-xs text-green-600">✓ 利用可能</span>
              )}
              {availabilityStatus === "taken" && (
                <span className="text-xs text-destructive">
                  ✗ このIDは既に使われています
                </span>
              )}
              {availabilityStatus === "error" && (
                <span className="text-xs text-destructive">確認に失敗しました</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {normalizedDisplayUserId.length}/{DISPLAY_USER_ID_MAX_LENGTH}
            </span>
          </div>
        </div>

        {/* 自己紹介 */}
        <div>
          <label
            htmlFor="profile-edit-intro"
            className="mb-1 block text-xs font-semibold text-muted-foreground"
          >
            自己紹介
          </label>
          <textarea
            id="profile-edit-intro"
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
            maxLength={MAX_INTRODUCTION_LENGTH}
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="好きなものや最近ハマっていることなど"
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {introduction.length}/{MAX_INTRODUCTION_LENGTH}
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition disabled:opacity-60"
        >
          {saving ? "保存中..." : "保存"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
        >
          キャンセル
        </button>
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
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(profile.followerCount);
  const [editingIntroduction, setEditingIntroduction] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

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

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const profilePath = buildUserProfilePath(profile);
  const rankingCards: PublicRankingWithAuthor[] = rankings.map((ranking) => ({
    ...ranking,
    author: profile,
  }));
  const handleFollowChange = useCallback(
    (nextIsFollowing: boolean) => {
      if (nextIsFollowing === isFollowing) {
        return;
      }

      setIsFollowing(nextIsFollowing);
      setFollowerCount((current) =>
        nextIsFollowing ? current + 1 : Math.max(0, current - 1),
      );
    },
    [isFollowing],
  );

  return (
    <AppShell>
      {/* AppShellのpx-4, py-6を打ち消してフルブリードの白背景にする */}
      <div className="-mx-4 -mt-6 min-h-screen bg-card">
        <div className="mb-2 px-4 pt-4">
          <BackButton />
        </div>

        <section className="border-b border-border px-4 pb-5 pt-2">
          <div className="flex items-center justify-between gap-4">
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

            {isOwnProfile && !editingProfile ? (
              <div ref={menuRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="メニュー"
                >
                  <MoreVerticalIcon />
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 top-8 z-10 min-w-[160px] rounded-lg border border-border bg-card py-1 shadow-md">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setEditingProfile(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-foreground transition hover:bg-muted"
                    >
                      プロフィール編集
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {!isOwnProfile ? (
              <div className="shrink-0">
                <FollowButton
                  userId={profile.id}
                  initialIsFollowing={isFollowing}
                  onChange={handleFollowChange}
                />
              </div>
            ) : null}
          </div>

          {/* 自己紹介セクション */}
          {editingIntroduction ? (
            <IntroductionInlineEditor
              currentIntroduction={displayIntroduction}
              onClose={() => setEditingIntroduction(false)}
            />
          ) : (
            <div className="mt-3">
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

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <StatLink label="公開ランキング" value={rankings.length} />
            <StatLink
              href={`${profilePath}/following`}
              label="フォロー"
              value={profile.followingCount}
            />
            <StatLink
              href={`${profilePath}/followers`}
              label="フォロワー"
              value={followerCount}
            />
          </div>
        </section>

        {editingProfile ? (
          <ProfileEditForm onClose={() => setEditingProfile(false)} />
        ) : null}

        {rankingCards.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              公開ランキングはまだありません。
            </p>
          </div>
        ) : (
          <div>
            {rankingCards.map((ranking, index) => (
              <RankingCard
                key={ranking.id}
                ranking={ranking}
                showBorder={index < rankingCards.length - 1}
                showTagBadge
                onAvatarClick={(_event, author) => {
                  router.push(buildUserProfilePath(author));
                }}
                onTagClick={(_event, tagName) => {
                  router.push(`/search?q=${encodeURIComponent('#' + tagName)}&tab=rankings`);
                }}
              />
            ))}
          </div>
        )}

        <div className="h-8" aria-hidden="true" />
      </div>
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

