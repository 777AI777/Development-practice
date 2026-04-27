"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/back-button";
import { FollowButton } from "@/components/follow-button";
import { usePageTransition } from "@/components/page-transition-provider";
import { SmartRankingCard } from "@/components/smart-ranking-card";
import { UserActionMenu } from "@/components/user-action-menu";
import { useToast } from "@/components/toast-provider";
import { useDisplayUserIdCheck } from "@/hooks/use-display-user-id-check";
import { useListCache } from "@/hooks/use-list-cache";
import type { PageResult } from "@/hooks/use-list-cache";
import { useSessionUser } from "@/hooks/use-session-user";
import type {
  PublicRankingWithAuthorAndComment,
  UserProfileWithCounts,
  UserRelationship,
} from "@/lib/types";
import {
  buildUserProfilePath,
  DISPLAY_USER_ID_MAX_LENGTH,
  getUserInitial,
  normalizeDisplayUserId,
} from "@/lib/user-utils";

function createUserRankingsFetcher(userId: string, type: "posts" | "rankings") {
  return async (cursor: string | null, signal: AbortSignal): Promise<PageResult<PublicRankingWithAuthorAndComment>> => {
    const params = new URLSearchParams({ limit: "20", type });
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/v1/users/${userId}/rankings?${params}`, { signal, cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: { message?: string } }).error?.message ?? "ランキングの読み込みに失敗しました。");
    }
    const json = (await res.json()) as { data: { items: PublicRankingWithAuthorAndComment[]; nextCursor: string | null } };
    return { items: json.data.items, nextCursor: json.data.nextCursor };
  };
}

interface UserProfileContentProps {
  profile: UserProfileWithCounts;
  initialRelationship: UserRelationship;
  isOwnProfile: boolean;
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

function LinkIcon() {
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
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function getDomainInfo(url: string): { label: string; icon: React.ReactNode } {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");

    if (hostname.includes("x.com") || hostname.includes("twitter.com")) {
      return { label: "X", icon: <span className="text-xs font-bold">{"\u{1D54F}"}</span> };
    }
    if (hostname.includes("instagram.com")) {
      return { label: "Instagram", icon: <span className="text-xs">{"\uD83D\uDCF7"}</span> };
    }
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return { label: "YouTube", icon: <span className="text-xs">{"\u25B6"}</span> };
    }
    if (hostname.includes("tiktok.com")) {
      return { label: "TikTok", icon: <span className="text-xs">{"\u266A"}</span> };
    }
    if (hostname.includes("github.com")) {
      return { label: "GitHub", icon: <span className="text-xs">{"\u2328"}</span> };
    }
    if (hostname.includes("note.com")) {
      return { label: "note", icon: <span className="text-xs">{"\uD83D\uDCDD"}</span> };
    }

    return { label: hostname, icon: <LinkIcon /> };
  } catch {
    return { label: url, icon: <LinkIcon /> };
  }
}

function UserProfileContentInner({
  profile,
  initialRelationship,
  isOwnProfile,
}: UserProfileContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signalReady } = usePageTransition();
  const { pushToast } = useToast();
  const { user, updateDisplayName, updateDisplayUserId, updateIntroduction, updateLinks } =
    useSessionUser();
  const impressionSentRef = useRef(false);
  const [isFollowing, setIsFollowing] = useState(initialRelationship.isFollowing);
  const [followerCount, setFollowerCount] = useState(profile.followerCount);
  const [activeTab, setActiveTab] = useState<"posts" | "rankings">("posts");
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(
    isOwnProfile && searchParams.get("edit") === "true",
  );
  const menuRef = useRef<HTMLDivElement>(null);

  const postsFetcher = useMemo(() => createUserRankingsFetcher(profile.id, "posts"), [profile.id]);
  const rankingsFetcher = useMemo(() => createUserRankingsFetcher(profile.id, "rankings"), [profile.id]);

  const {
    items: postItems,
    isLoading: isLoadingPosts,
    isLoadingMore: isLoadingMorePosts,
    hasMore: hasMorePosts,
    error: postsError,
    hasFetched: hasFetchedPosts,
    refresh: refreshPosts,
    sentinelRef: postsSentinelRef,
  } = useListCache<PublicRankingWithAuthorAndComment>({
    cache: { cacheKey: `okiny:user-posts:${profile.id}` },
    fetcher: postsFetcher,
    enabled: activeTab === "posts",
    scrollRestoreKey: `scroll:user-posts:${profile.id}`,
  });

  const {
    items: rankingItems,
    isLoading: isLoadingRankings,
    isLoadingMore: isLoadingMoreRankings,
    hasMore: hasMoreRankings,
    error: rankingsError,
    hasFetched: hasFetchedRankings,
    refresh: refreshRankings,
    sentinelRef: rankingsSentinelRef,
  } = useListCache<PublicRankingWithAuthorAndComment>({
    cache: { cacheKey: `okiny:user-rankings:${profile.id}` },
    fetcher: rankingsFetcher,
    enabled: activeTab === "rankings",
    scrollRestoreKey: `scroll:user-rankings:${profile.id}`,
  });

  const postItemsRef = useRef(postItems);
  postItemsRef.current = postItems;

  // URL (searchParams) is the SSoT for editingProfile.
  // editingProfile is intentionally excluded from deps — reacts only to URL changes, not state changes.
  useEffect(() => {
    if (isOwnProfile) {
      const shouldEdit = searchParams.get("edit") === "true";
      if (shouldEdit !== editingProfile) {
        setEditingProfile(shouldEdit);
      }
    }
  }, [searchParams, isOwnProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  // ローカル表示用: ユーザーメタデータが更新されたら即反映
  const displayIntroduction = isOwnProfile
    ? (user?.introduction ?? profile.introduction)
    : profile.introduction;

  // --- Inline profile edit state ---
  const [editName, setEditName] = useState(user?.name ?? profile.displayName);
  const [editUserId, setEditUserId] = useState(user?.displayUserId ?? profile.displayUserId ?? "");
  const [editIntroduction, setEditIntroduction] = useState(displayIntroduction ?? "");
  const [editLinks, setEditLinks] = useState<Array<{ url: string }>>(
    (user?.links ?? profile.links ?? []).map((l) => ({ url: l.url })),
  );
  const [savingProfile, setSavingProfile] = useState(false);

  const normalizedEditUserId = normalizeDisplayUserId(editUserId);
  const isEditUserIdDirty = normalizedEditUserId !== (user?.displayUserId ?? profile.displayUserId ?? "");
  const editUserIdCheckValue = isEditUserIdDirty ? normalizedEditUserId : "";
  const { status: editUserIdAvailability } = useDisplayUserIdCheck(editUserIdCheckValue);

  const isEditNameDirty = editName.trim() !== (user?.name ?? profile.displayName);
  const normalizedEditIntro = editIntroduction.trim();
  const isEditIntroDirty = normalizedEditIntro !== (displayIntroduction ?? "");

  const currentLinks = user?.links ?? profile.links ?? [];
  const normalizeLinks = (links: ReadonlyArray<{ url: string }>) =>
    links.filter((l) => l.url.trim()).map((l) => ({ url: l.url.trim() }));
  const isEditLinksDirty =
    JSON.stringify(normalizeLinks(editLinks)) !== JSON.stringify(normalizeLinks(currentLinks));

  const hasProfileChanges = isEditNameDirty || isEditUserIdDirty || isEditIntroDirty || isEditLinksDirty;
  const editNameValid = editName.trim().length > 0;
  const editUserIdValid = !isEditUserIdDirty || (normalizedEditUserId.length > 0 && editUserIdAvailability === "available");
  const editIntroValid = normalizedEditIntro.length <= MAX_INTRODUCTION_LENGTH;
  const editLinksValid = editLinks.every((l) => {
    if (!l.url.trim()) return true;
    try {
      const parsed = new URL(l.url.trim());
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  });
  const canSaveProfile = hasProfileChanges && editNameValid && editUserIdValid && editIntroValid && editLinksValid && !savingProfile;

  // Re-initialize edit state when entering edit mode
  useEffect(() => {
    if (editingProfile) {
      setEditName(user?.name ?? profile.displayName);
      setEditUserId(user?.displayUserId ?? profile.displayUserId ?? "");
      setEditIntroduction(displayIntroduction ?? "");
      setEditLinks((user?.links ?? profile.links ?? []).map(l => ({ url: l.url })));
    }
  }, [editingProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    signalReady();
  }, [signalReady, searchParams]);

  useEffect(() => {
    setFollowerCount(profile.followerCount);
  }, [profile.followerCount]);

  useEffect(() => {
    setIsFollowing(initialRelationship.isFollowing);
  }, [initialRelationship.isFollowing]);

  useEffect(() => {
    if (impressionSentRef.current || !hasFetchedPosts || postItemsRef.current.length === 0) {
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
        rankingIds: postItemsRef.current.map((ranking) => ranking.id),
      }),
    }).catch(() => {});
  }, [hasFetchedPosts, profile.id, user]);

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

  const handleProfileSave = useCallback(async () => {
    if (!canSaveProfile) return;
    setSavingProfile(true);

    try {
      const results: string[] = [];

      if (isEditNameDirty) {
        const status = await updateDisplayName(editName.trim());
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

      if (isEditUserIdDirty) {
        const status = await updateDisplayUserId(normalizedEditUserId);
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

      if (isEditIntroDirty) {
        const status = await updateIntroduction(normalizedEditIntro);
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

      if (isEditLinksDirty) {
        const validLinks = editLinks.filter(l => l.url.trim());
        const status = await updateLinks(validLinks);
        if (status !== "success") {
          pushToast({
            type: "error",
            message: status === "invalid"
              ? "リンクのURLが正しくありません。"
              : "リンクの更新に失敗しました。",
          });
          return;
        }
        results.push("リンク");
      }

      pushToast({ type: "success", message: `${results.join("・")}を更新しました。` });
      router.replace(profilePath);
    } finally {
      setSavingProfile(false);
    }
  }, [canSaveProfile, isEditNameDirty, isEditUserIdDirty, isEditIntroDirty, isEditLinksDirty, editName, normalizedEditUserId, normalizedEditIntro, editLinks, updateDisplayName, updateDisplayUserId, updateIntroduction, updateLinks, pushToast, router, profilePath]);

  return (
    <AppShell>
      {/* AppShellのpx-4, py-6を打ち消してフルブリードの白背景にする */}
      <div className="-mx-4 -mt-6 min-h-screen bg-card">
        <div className="px-4 pt-2">
          <BackButton />
        </div>

        <section className="border-b border-border px-4 pb-5">
          {/* Edit mode: cancel/save buttons at top */}
          {isOwnProfile && editingProfile ? (
            <div className="flex justify-end gap-2 mb-2">
              <button
                type="button"
                onClick={() => router.replace(profilePath)}
                disabled={savingProfile}
                className="rounded-md px-3 py-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-60"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleProfileSave}
                disabled={!canSaveProfile}
                className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition disabled:opacity-60"
              >
                {savingProfile ? "保存中..." : "保存"}
              </button>
            </div>
          ) : null}

          {editingProfile ? (
            <>
              {/* Edit mode: inline editing */}
              <div className="flex items-start gap-4">
                {/* Avatar (same as view mode) */}
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
                <div className="min-w-0 flex-1">
                  {/* Display name input */}
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={MAX_DISPLAY_NAME_LENGTH}
                    className="w-full truncate border-b border-border bg-transparent text-xl font-bold text-foreground focus:border-primary focus:outline-none"
                    placeholder="表示名"
                  />
                  <div className="flex items-center justify-between mt-0.5">
                    {editName.trim().length === 0 ? (
                      <p className="text-xs text-destructive">表示名は必須です</p>
                    ) : (
                      <span />
                    )}
                    <p className="text-right text-xs text-muted-foreground">
                      {editName.length}/{MAX_DISPLAY_NAME_LENGTH}
                    </p>
                  </div>
                  {/* @ID input */}
                  <div className="mt-1 flex items-center">
                    <span className="text-sm text-muted-foreground">@</span>
                    <input
                      value={editUserId}
                      onChange={(e) => setEditUserId(e.target.value)}
                      maxLength={DISPLAY_USER_ID_MAX_LENGTH}
                      className="w-full bg-transparent text-sm text-muted-foreground focus:text-foreground border-b border-border focus:border-primary focus:outline-none"
                      placeholder="user_id"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </div>
                  {/* Availability status */}
                  <div className="mt-1">
                    {editUserIdAvailability === "checking" && (
                      <span className="text-xs text-muted-foreground">確認中...</span>
                    )}
                    {editUserIdAvailability === "available" && (
                      <span className="text-xs text-green-600">✓ 利用可能</span>
                    )}
                    {editUserIdAvailability === "taken" && (
                      <span className="text-xs text-destructive">✗ 使用済み</span>
                    )}
                    {editUserIdAvailability === "error" && (
                      <span className="text-xs text-destructive">確認に失敗</span>
                    )}
                    {editUserIdAvailability === "idle" && (
                      <span className="text-xs text-muted-foreground">英小文字・数字・アンダースコア（3〜20文字）</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Introduction textarea */}
              <textarea
                value={editIntroduction}
                onChange={(e) => setEditIntroduction(e.target.value)}
                maxLength={MAX_INTRODUCTION_LENGTH}
                rows={3}
                className="mt-3 w-full bg-transparent text-sm text-muted-foreground border-b border-border focus:border-primary focus:outline-none resize-none"
                placeholder="自己紹介を入力"
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {editIntroduction.length}/{MAX_INTRODUCTION_LENGTH}
              </p>

              {/* Links Editor */}
              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">リンク（最大5件）</p>
                {editLinks.map((link, index) => (
                  <div key={index} className="mb-2 flex items-center gap-2">
                    <input
                      value={link.url}
                      onChange={(e) => {
                        const newLinks = editLinks.map((l, i) =>
                          i === index ? { url: e.target.value } : l
                        );
                        setEditLinks(newLinks);
                      }}
                      className="flex-1 border-b border-border bg-transparent text-sm text-foreground focus:border-primary focus:outline-none"
                      placeholder="https://example.com"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEditLinks(editLinks.filter((_, i) => i !== index));
                      }}
                      className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      aria-label="削除"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                ))}
                {editLinks.length < 5 ? (
                  <button
                    type="button"
                    onClick={() => setEditLinks([...editLinks, { url: "" }])}
                    className="text-xs text-muted-foreground transition hover:text-foreground"
                  >
                    + リンクを追加
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <>
              {/* View mode */}
              <div className="flex items-start justify-between">
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
                      {isOwnProfile ? (user?.name ?? profile.displayName) : profile.displayName}
                    </h1>
                    {(isOwnProfile ? (user?.displayUserId ?? profile.displayUserId) : profile.displayUserId) ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        @{isOwnProfile ? (user?.displayUserId ?? profile.displayUserId) : profile.displayUserId}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isOwnProfile ? (
                    <div ref={menuRef} className="relative">
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
                              router.push(`${profilePath}?edit=true`);
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
                    <>
                      <FollowButton
                        userId={profile.id}
                        initialIsFollowing={isFollowing}
                        onChange={handleFollowChange}
                      />
                      <UserActionMenu
                        userId={profile.id}
                        displayName={profile.displayName}
                        initialRelationship={{
                          isMuted: initialRelationship.isMuted,
                          isBlocked: initialRelationship.isBlocked,
                        }}
                      />
                    </>
                  ) : null}
                </div>
              </div>

              {/* Introduction (view only) */}
              {displayIntroduction ? (
                <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">
                  {displayIntroduction}
                </p>
              ) : isOwnProfile ? (
                <button
                  type="button"
                  onClick={() => router.push(`${profilePath}?edit=true`)}
                  className="mt-3 text-sm text-muted-foreground/60 transition hover:text-muted-foreground"
                >
                  自己紹介を追加...
                </button>
              ) : null}

              {/* Profile Links */}
              {(() => {
                const profileLinks = isOwnProfile
                  ? (user?.links ?? profile.links ?? [])
                  : (profile.links ?? []);
                return profileLinks.length > 0 ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {profileLinks.map((link, index) => {
                      const domain = getDomainInfo(link.url);
                      return (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary transition hover:opacity-70"
                        >
                          {domain.icon}
                          <span>{domain.label}</span>
                        </a>
                      );
                    })}
                  </div>
                ) : null;
              })()}
            </>
          )}

          {/* Stats (shown in both modes) */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <StatLink label="公開ランキング" value={profile.publicRankingCount} />
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

        {/* タブ */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("posts")}
            className={`flex-1 py-3 text-sm font-semibold text-center transition ${
              activeTab === "posts"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
          >
            投稿
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rankings")}
            className={`flex-1 py-3 text-sm font-semibold text-center transition ${
              activeTab === "rankings"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
          >
            ランキング
          </button>
        </div>

        {/* 投稿タブ */}
        {activeTab === "posts" && (
          <>
            {postsError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4">
                <p className="text-base font-bold text-destructive">読み込みに失敗しました。</p>
                <p className="mt-1 text-sm text-destructive/80">{postsError}</p>
                <button type="button" onClick={refreshPosts} className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-destructive/30 bg-card px-4 text-sm font-semibold text-destructive">再読み込み</button>
              </div>
            ) : hasFetchedPosts && !isLoadingPosts && postItems.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">公開ランキングはまだありません。</p>
            ) : (
              <div className="overflow-hidden rounded-xl bg-card">
                {postItems.map((ranking, index) => {
                  const showBorder = index < postItems.length - 1;
                  return (
                    <SmartRankingCard
                      key={ranking.id}
                      ranking={ranking}
                      showBorder={showBorder}
                      showTagBadge
                      showBookmark
                    />
                  );
                })}
              </div>
            )}
            {hasMorePosts && (
              <div ref={postsSentinelRef} className="py-4 text-center">
                {isLoadingMorePosts && <p className="text-sm text-muted-foreground">読み込み中...</p>}
              </div>
            )}
          </>
        )}

        {/* ランキングタブ */}
        {activeTab === "rankings" && (
          <>
            {rankingsError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4">
                <p className="text-base font-bold text-destructive">読み込みに失敗しました。</p>
                <p className="mt-1 text-sm text-destructive/80">{rankingsError}</p>
                <button type="button" onClick={refreshRankings} className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-destructive/30 bg-card px-4 text-sm font-semibold text-destructive">再読み込み</button>
              </div>
            ) : hasFetchedRankings && !isLoadingRankings && rankingItems.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">ランキングはまだありません。</p>
            ) : (
              <div className="overflow-hidden rounded-xl bg-card">
                {rankingItems.map((ranking, index) => {
                  const showBorder = index < rankingItems.length - 1;
                  return (
                    <SmartRankingCard
                      key={ranking.id}
                      ranking={ranking}
                      showBorder={showBorder}
                      showTagBadge
                      showBookmark
                    />
                  );
                })}
              </div>
            )}
            {hasMoreRankings && (
              <div ref={rankingsSentinelRef} className="py-4 text-center">
                {isLoadingMoreRankings && <p className="text-sm text-muted-foreground">読み込み中...</p>}
              </div>
            )}
          </>
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
