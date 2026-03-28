"use client";

import Image from "next/image";
import Link from "next/link";
import { type MouseEvent, type ReactNode, Suspense, useCallback, useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FollowButton } from "@/components/follow-button";
import { usePageTransition } from "@/components/page-transition-provider";
import { useToast } from "@/components/toast-provider";
import { invalidateMyProfileStats } from "@/hooks/use-my-profile-stats";
import type { UserProfile, UserProfileWithCounts } from "@/lib/types";
import { buildUserProfilePath, getUserInitial } from "@/lib/user-utils";

interface FollowUsersListContentProps {
  profile: UserProfileWithCounts;
  followers: readonly UserProfile[];
  following: readonly UserProfile[];
  initialTab: "followers" | "following";
  isOwnProfile: boolean;
  followingUserIds: ReadonlySet<string>;
}

function UserAvatar({ user }: { user: UserProfile }) {
  return user.avatarUrl ? (
    <Image
      src={user.avatarUrl}
      alt={user.displayName}
      width={44}
      height={44}
      className="h-11 w-11 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
      {getUserInitial(user.displayName, "?")}
    </div>
  );
}

function UserInfo({ user }: { user: UserProfile }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-foreground">
        {user.displayName}
      </p>
      {user.displayUserId ? (
        <p className="truncate text-xs text-muted-foreground">
          @{user.displayUserId}
        </p>
      ) : null}
    </div>
  );
}

function EmptyState({ tab }: { tab: "followers" | "following" }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="text-sm text-muted-foreground">
        {tab === "followers"
          ? "フォロワーはまだいません"
          : "まだ誰もフォローしていません"}
      </p>
    </div>
  );
}

function UserListItem({
  user,
  profilePath,
  isSelf,
  followButton,
  removeButton,
}: {
  user: UserProfile;
  profilePath: string;
  isSelf: boolean;
  followButton: ReactNode | null;
  removeButton: ReactNode | null;
}) {
  return (
    <div
      className="flex items-center gap-3 border-b border-border px-4 py-3 transition hover:bg-muted/50"
    >
      <Link href={profilePath} className="flex shrink-0 items-center">
        <UserAvatar user={user} />
      </Link>

      <Link href={profilePath} className="min-w-0 flex-1">
        <UserInfo user={user} />
      </Link>

      {!isSelf && (followButton || removeButton) ? (
        <div className="flex shrink-0 items-center gap-2">
          {followButton}
          {removeButton}
        </div>
      ) : null}
    </div>
  );
}

function FollowUsersListContentInner({
  profile,
  followers: initialFollowers,
  following,
  initialTab,
  isOwnProfile,
  followingUserIds,
}: FollowUsersListContentProps) {
  const { signalReady } = usePageTransition();
  const { pushToast } = useToast();

  const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);
  const [localFollowers, setLocalFollowers] = useState<readonly UserProfile[]>(initialFollowers);
  const [localFollowing, setLocalFollowing] = useState<readonly UserProfile[]>(following);
  const [localFollowerCount, setLocalFollowerCount] = useState(profile.followerCount);
  const [localFollowingCount, setLocalFollowingCount] = useState(profile.followingCount);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);

  const localFollowersRef = useRef(localFollowers);
  localFollowersRef.current = localFollowers;
  const localFollowerCountRef = useRef(localFollowerCount);
  localFollowerCountRef.current = localFollowerCount;

  useEffect(() => {
    signalReady();
  }, [signalReady]);

  const handleTabChange = useCallback(
    (tab: "followers" | "following") => {
      setActiveTab(tab);

      const basePath = buildUserProfilePath(profile);
      const newPath = tab === "followers"
        ? `${basePath}/followers`
        : `${basePath}/following`;
      window.history.replaceState(null, "", newPath);
    },
    [profile],
  );

  const handleRemoveFollowerClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>, user: UserProfile) => {
      event.preventDefault();
      event.stopPropagation();
      setDeleteTarget(user);
    },
    [],
  );

  const handleRemoveFollowerConfirm = useCallback(async () => {
    if (!deleteTarget) return;

    const targetUser = deleteTarget;
    setDeleteTarget(null);

    // 楽観的更新: 即座にリストから除去 + カウント更新
    const previousFollowers = localFollowersRef.current;
    const previousFollowerCount = localFollowerCountRef.current;
    setLocalFollowers((prev) => prev.filter((u) => u.id !== targetUser.id));
    setLocalFollowerCount((prev) => Math.max(0, prev - 1));

    try {
      const response = await fetch(`/api/v1/followers/${targetUser.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setLocalFollowers(previousFollowers);
        setLocalFollowerCount(previousFollowerCount);
        pushToast({
          type: "error",
          message: "フォロワーの削除に失敗しました",
        });
        return;
      }

      invalidateMyProfileStats();
    } catch {
      setLocalFollowers(previousFollowers);
      setLocalFollowerCount(previousFollowerCount);
      pushToast({
        type: "error",
        message: "フォロワーの削除に失敗しました",
      });
    }
  }, [deleteTarget, pushToast]);

  const handleFollowingChange = useCallback(
    (userId: string, nextIsFollowing: boolean) => {
      if (!nextIsFollowing) {
        // フォロー解除 → followingリストから除去
        setLocalFollowing((prev) => prev.filter((u) => u.id !== userId));
      }
      if (isOwnProfile) {
        setLocalFollowingCount((prev) =>
          nextIsFollowing ? prev + 1 : Math.max(0, prev - 1),
        );
      }
    },
    [isOwnProfile],
  );

  const handleFollowerFollowChange = useCallback(
    (_userId: string, nextIsFollowing: boolean) => {
      if (isOwnProfile) {
        setLocalFollowingCount((prev) =>
          nextIsFollowing ? prev + 1 : Math.max(0, prev - 1),
        );
      }
    },
    [isOwnProfile],
  );

  const followingList = localFollowing;
  const followersList = localFollowers;

  return (
    <AppShell>
      {/* ヘッダー: 戻るボタン + ユーザー名 */}
      <div className="mb-4">
        <Link
          href={buildUserProfilePath(profile)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <span aria-hidden="true">{"\u2190"}</span>
          <span>{profile.displayName}</span>
        </Link>
      </div>

      {/* タブバー */}
      <div className="flex border-b border-border" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "following"}
          onClick={() => handleTabChange("following")}
          className={`flex-1 py-3 text-center text-sm font-semibold transition ${
            activeTab === "following"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {`フォロー中 ${localFollowingCount}`}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "followers"}
          onClick={() => handleTabChange("followers")}
          className={`flex-1 py-3 text-center text-sm font-semibold transition ${
            activeTab === "followers"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {`フォロワー ${localFollowerCount}`}
        </button>
      </div>

      {/* フォロー中タブ */}
      {activeTab === "following" && (
        <div role="tabpanel">
          {followingList.length === 0 ? (
            <EmptyState tab="following" />
          ) : (
            <div>
              {followingList.map((user) => {
                const profilePath = buildUserProfilePath(user);
                const isSelf = user.id === profile.id;

                return (
                  <UserListItem
                    key={user.id}
                    user={user}
                    profilePath={profilePath}
                    isSelf={isSelf}
                    followButton={
                      <FollowButton
                        userId={user.id}
                        initialIsFollowing={
                          isOwnProfile ? true : followingUserIds.has(user.id)
                        }
                        onChange={(nextIsFollowing) =>
                          handleFollowingChange(user.id, nextIsFollowing)
                        }
                      />
                    }
                    removeButton={null}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* フォロワータブ */}
      {activeTab === "followers" && (
        <div role="tabpanel">
          {followersList.length === 0 ? (
            <EmptyState tab="followers" />
          ) : (
            <div>
              {followersList.map((user) => {
                const profilePath = buildUserProfilePath(user);
                const isSelf = user.id === profile.id;

                return (
                  <UserListItem
                    key={user.id}
                    user={user}
                    profilePath={profilePath}
                    isSelf={isSelf}
                    followButton={
                      <FollowButton
                        userId={user.id}
                        initialIsFollowing={followingUserIds.has(user.id)}
                        onChange={(nextIsFollowing) =>
                          handleFollowerFollowChange(user.id, nextIsFollowing)
                        }
                      />
                    }
                    removeButton={
                      isOwnProfile ? (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveFollowerClick(e, user)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          aria-label={`${user.displayName}をフォロワーから削除`}
                          data-page-transition-ignore
                        >
                          {"\u2715"}
                        </button>
                      ) : null
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* フォロワー削除確認ダイアログ */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="フォロワーを削除"
        message={`${deleteTarget?.displayName ?? ""}をフォロワーから削除しますか？`}
        confirmLabel="削除"
        cancelLabel="キャンセル"
        variant="destructive"
        onConfirm={handleRemoveFollowerConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppShell>
  );
}

export function FollowUsersListContent(props: FollowUsersListContentProps) {
  return (
    <Suspense fallback={null}>
      <FollowUsersListContentInner {...props} />
    </Suspense>
  );
}
