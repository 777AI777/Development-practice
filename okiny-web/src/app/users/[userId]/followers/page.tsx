import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FollowUsersListContent } from "@/components/follow-users-list-content";
import { listFollowers } from "@/lib/supabase-rest";
import { getUserProfileWithFallback } from "@/lib/user-profile-with-fallback";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const profile = await getUserProfileWithFallback(userId);

  if (!profile) {
    return {
      title: "フォロワー",
    };
  }

  return {
    title: `${profile.displayName}のフォロワー`,
    description: `${profile.displayName}をフォローしているユーザー一覧`,
  };
}

export default async function UserFollowersPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const profile = await getUserProfileWithFallback(userId);

  if (!profile) {
    notFound();
  }

  const users = await listFollowers({ userId: profile.id }).catch(() => []);

  return (
    <FollowUsersListContent
      profile={profile}
      users={users}
      type="followers"
    />
  );
}
