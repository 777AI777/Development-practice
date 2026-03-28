import type { PublicRankingWithAuthor } from "@/lib/types";

interface FeedCacheEntry {
  rankings: PublicRankingWithAuthor[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface StoredFeedCache extends FeedCacheEntry {
  cachedAt: number;
}

const CACHE_KEY = "okiny:following-feed-cache";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1時間

function isStoredFeedCache(data: unknown): data is StoredFeedCache {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    Array.isArray(obj.rankings) &&
    obj.rankings.length > 0 &&
    (typeof obj.nextCursor === "string" || obj.nextCursor === null) &&
    typeof obj.hasMore === "boolean" &&
    typeof obj.cachedAt === "number"
  );
}

export function getFollowingFeedCache(): FeedCacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const json = sessionStorage.getItem(CACHE_KEY);
    if (!json) return null;
    const parsed: unknown = JSON.parse(json);
    if (!isStoredFeedCache(parsed)) return null;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setFollowingFeedCache(entry: FeedCacheEntry): void {
  if (typeof window === "undefined") return;
  if (entry.rankings.length === 0) return;
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        rankings: entry.rankings,
        nextCursor: entry.nextCursor,
        hasMore: entry.hasMore,
        cachedAt: Date.now(),
      }),
    );
  } catch {
    // sessionStorage full or blocked
  }
}

/** 一覧表示時にタイムスタンプをリフレッシュ（TTLリセット） */
export function touchFollowingFeedCache(): void {
  if (typeof window === "undefined") return;
  try {
    const json = sessionStorage.getItem(CACHE_KEY);
    if (!json) return;
    const parsed: unknown = JSON.parse(json);
    if (!isStoredFeedCache(parsed)) return;
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...parsed, cachedAt: Date.now() }),
    );
  } catch {
    // ignore
  }
}

/** キャッシュクリア時に発火するカスタムイベント名 */
export const FOLLOWING_FEED_INVALIDATED_EVENT =
  "okiny:following-feed-invalidated";

export function clearFollowingFeedCache(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {}
  // マウント中の useFollowingFeed に再フェッチを通知
  window.dispatchEvent(new CustomEvent(FOLLOWING_FEED_INVALIDATED_EVENT));
}

/** 特定ユーザーのランキングのみキャッシュから除外 */
export function removeUserFromFeedCache(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    const json = sessionStorage.getItem(CACHE_KEY);
    if (!json) return;
    const parsed: unknown = JSON.parse(json);
    if (!isStoredFeedCache(parsed)) return;

    const filtered = parsed.rankings.filter(
      (ranking) => ranking.userId !== userId,
    );

    if (filtered.length > 0) {
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          ...parsed,
          rankings: filtered,
        }),
      );
    } else {
      sessionStorage.removeItem(CACHE_KEY);
    }
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(FOLLOWING_FEED_INVALIDATED_EVENT));
}
