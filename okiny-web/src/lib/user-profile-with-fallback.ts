import type { UserProfileWithCounts } from "@/lib/types";
import {
  countPublicRankingsByUser,
  getUserProfile,
  getUserProfileWithCounts,
  listFollowers,
  listFollowing,
} from "@/lib/supabase-rest";

export async function getUserProfileWithFallback(
  userIdentifier: string,
): Promise<UserProfileWithCounts | null> {
  const profileWithCounts = await getUserProfileWithCounts(userIdentifier);
  if (profileWithCounts) {
    const publicRankingCount = await countPublicRankingsByUser(profileWithCounts.id).catch(() => 0);
    return { ...profileWithCounts, publicRankingCount };
  }

  const profile = await getUserProfile(userIdentifier);
  if (!profile) {
    return null;
  }

  const [followers, following, publicRankingCount] = await Promise.all([
    listFollowers({ userId: profile.id }).catch(() => []),
    listFollowing({ userId: profile.id }).catch(() => []),
    countPublicRankingsByUser(profile.id).catch(() => 0),
  ]);

  return {
    ...profile,
    followerCount: followers.length,
    followingCount: following.length,
    publicRankingCount,
  };
}
