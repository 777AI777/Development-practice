"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect } from "react";

import { AppShell } from "@/components/app-shell";
import { usePageTransition } from "@/components/page-transition-provider";
import type { UserProfile, UserProfileWithCounts } from "@/lib/types";
import { buildUserProfilePath, getUserInitial } from "@/lib/user-utils";

interface FollowUsersListContentProps {
  profile: UserProfileWithCounts;
  users: readonly UserProfile[];
  type: "followers" | "following";
}

function FollowUsersListContentInner({
  profile,
  users,
  type,
}: FollowUsersListContentProps) {
  const { signalReady } = usePageTransition();

  useEffect(() => {
    signalReady();
  }, [signalReady]);

  const title = type === "followers" ? "フォロワー" : "フォロー中";
  const count =
    type === "followers" ? profile.followerCount : profile.followingCount;

  return (
    <AppShell>
      <div className="mb-4">
        <Link
          href={buildUserProfilePath(profile)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <span aria-hidden="true">←</span>
          <span>プロフィールへ戻る</span>
        </Link>
      </div>

      <section className="mb-6 rounded-2xl border border-border bg-card px-6 py-5">
        <p className="text-sm text-muted-foreground">{profile.displayName}</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <span className="text-sm text-muted-foreground">{count}件</span>
        </div>
      </section>

      {users.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {type === "followers"
              ? "フォロワーはまだいません。"
              : "フォロー中のユーザーはまだいません。"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card">
          {users.map((user, index) => {
            const profilePath = buildUserProfilePath(user);

            return (
              <Link
                key={user.id}
                href={profilePath}
                className={`flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50 ${
                  index < users.length - 1 ? "border-b border-border" : ""
                }`}
              >
                {user.avatarUrl ? (
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
                )}

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
              </Link>
            );
          })}
        </div>
      )}
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
