import type { UserProfile, UserProfileWithCounts } from "@/lib/types";

import {
  listFollowers,
  listFollowing,
  getFollowingUserIds,
} from "@/lib/supabase-rest";
import { getAuthenticatedUserId } from "@/lib/supabase/auth-guard";
import { getUserProfileWithFallback } from "@/lib/user-profile-with-fallback";

export interface FollowPageData {
  readonly profile: UserProfileWithCounts;
  readonly followers: readonly UserProfile[];
  readonly following: readonly UserProfile[];
  readonly isOwnProfile: boolean;
  readonly followingUserIds: ReadonlySet<string>;
  readonly currentUserId: string | null;
}

/**
 * フォロワー/フォロー一覧ページ共通のデータ取得。
 * profile取得 → followers/following並列取得 → 認証チェック → フォロー状態取得。
 *
 * @returns ページデータ。ユーザーが見つからない場合は null。
 */
export async function getFollowPageData(
  userId: string,
): Promise<FollowPageData | null> {
  const profile = await getUserProfileWithFallback(userId);

  if (!profile) {
    return null;
  }

  // フォロワー・フォロー一覧を並列取得
  const [followers, following] = await Promise.all([
    listFollowers({ userId: profile.id }).catch(() => []),
    listFollowing({ userId: profile.id }).catch(() => []),
  ]);

  // ログインユーザー情報を取得（オプショナル: 未ログインでも閲覧可能）
  const auth = await getAuthenticatedUserId();
  const isOwnProfile = auth.ok && auth.userId === profile.id;

  // ログイン中の場合、リスト内ユーザーのフォロー状態を取得
  let followingUserIds: ReadonlySet<string> = new Set();
  if (auth.ok) {
    const allUserIds = [
      ...followers.map((u) => u.id),
      ...following.map((u) => u.id),
    ];
    const uniqueUserIds = [...new Set(allUserIds)];
    if (uniqueUserIds.length > 0) {
      followingUserIds = await getFollowingUserIds({
        followerId: auth.userId,
        targetUserIds: uniqueUserIds,
        accessToken: auth.accessToken,
      }).catch(() => new Set<string>());
    }
  }

  return {
    profile,
    followers,
    following,
    isOwnProfile,
    followingUserIds,
    currentUserId: auth.ok ? auth.userId : null,
  };
}
