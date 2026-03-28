import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FollowUsersListContent } from "@/components/follow-users-list-content";
import { getFollowPageData } from "@/lib/follow-page-data";
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
  const data = await getFollowPageData(userId);

  if (!data) {
    notFound();
  }

  return (
    <FollowUsersListContent
      profile={data.profile}
      followers={data.followers}
      following={data.following}
      initialTab="following"
      isOwnProfile={data.isOwnProfile}
      followingUserIds={data.followingUserIds}
      currentUserId={data.currentUserId}
    />
  );
}
