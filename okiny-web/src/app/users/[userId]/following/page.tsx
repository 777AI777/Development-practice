import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FollowUsersListContent } from "@/components/follow-users-list-content";
import { listFollowing } from "@/lib/supabase-rest";
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
      title: "フォロー",
    };
  }

  return {
    title: `${profile.displayName}のフォロー`,
    description: `${profile.displayName}がフォローしているユーザー一覧`,
  };
}

export default async function UserFollowingPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const profile = await getUserProfileWithFallback(userId);

  if (!profile) {
    notFound();
  }

  const users = await listFollowing({ userId: profile.id }).catch(() => []);

  return (
    <FollowUsersListContent
      profile={profile}
      users={users}
      type="following"
    />
  );
}
