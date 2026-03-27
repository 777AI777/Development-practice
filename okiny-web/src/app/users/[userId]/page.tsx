import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getUserProfile,
  listPublicRankingsByUser,
} from "@/lib/supabase/public-ranking";
import { UserProfileContent } from "@/components/user-profile-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;

  const profile = await getUserProfile(userId);
  if (!profile) {
    return { title: "ユーザーが見つかりません" };
  }

  return {
    title: `${profile.displayName}のプロフィール`,
    description: `${profile.displayName}の公開ランキング一覧`,
  };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const [profile, rankings] = await Promise.all([
    getUserProfile(userId),
    listPublicRankingsByUser(userId),
  ]);

  if (!profile) {
    notFound();
  }

  return (
    <UserProfileContent
      profile={profile}
      rankings={rankings}
    />
  );
}
