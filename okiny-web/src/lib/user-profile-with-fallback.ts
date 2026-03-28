import type { UserProfileWithCounts } from "@/lib/types";
import {
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
    return profileWithCounts;
  }

  const profile = await getUserProfile(userIdentifier);
  if (!profile) {
    return null;
  }

  const [followers, following] = await Promise.all([
    listFollowers({ userId: profile.id }).catch(() => []),
    listFollowing({ userId: profile.id }).catch(() => []),
  ]);

  return {
    ...profile,
    followerCount: followers.length,
    followingCount: following.length,
  };
}
