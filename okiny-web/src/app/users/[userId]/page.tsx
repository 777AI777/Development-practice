import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UserProfileContent } from "@/components/user-profile-content";
import { getRelationship } from "@/lib/supabase-rest";
import { createClient } from "@/lib/supabase/server";
import type { UserRelationship } from "@/lib/types";
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
      title: "ユーザーが見つかりません",
    };
  }

  return {
    title: `${profile.displayName}のプロフィール`,
    description: `${profile.displayName}の公開ランキング一覧とフォロー情報`,
  };
}

async function resolveViewerSession() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return {
      viewerUserId: session?.user.id ?? null,
      accessToken: session?.access_token ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null,
    };
  } catch {
    return {
      viewerUserId: null,
      accessToken: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null,
    };
  }
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const [profile, viewer] = await Promise.all([
    getUserProfileWithFallback(userId),
    resolveViewerSession(),
  ]);

  if (!profile) {
    notFound();
  }

  const isOwnProfile = viewer.viewerUserId === profile.id;

  const defaultRelationship: UserRelationship = {
    isFollowing: false,
    isMuted: false,
    isBlocked: false,
    isBlockedBy: false,
  };

  const relationship = viewer.viewerUserId && viewer.accessToken && !isOwnProfile
    ? await getRelationship({
        viewerId: viewer.viewerUserId,
        targetUserId: profile.id,
        accessToken: viewer.accessToken,
      }).catch(() => defaultRelationship)
    : defaultRelationship;

  // ブロック関係がある場合は notFound
  if (relationship.isBlocked || relationship.isBlockedBy) {
    notFound();
  }

  return (
    <UserProfileContent
      profile={profile}
      initialRelationship={relationship}
      isOwnProfile={isOwnProfile}
    />
  );
}
