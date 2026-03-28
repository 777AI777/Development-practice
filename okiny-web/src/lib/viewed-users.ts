import { VIEWED_USERS_KEY, VIEWED_USERS_MAX } from "./constants";
import type { ViewedUserEntry } from "./types";

function getStorageKey(userId: string): string {
  return `${VIEWED_USERS_KEY}:${userId}`;
}

/** 閲覧ユーザー履歴を取得する */
export function getViewedUsers(userId: string): ViewedUserEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 閲覧ユーザー履歴に追加する（先頭追加、重複排除、最大10件） */
export function addViewedUser(
  currentUserId: string,
  user: Omit<ViewedUserEntry, "viewedAt">,
): void {
  if (typeof window === "undefined") return;
  const current = getViewedUsers(currentUserId);
  const filtered = current.filter((u) => u.userId !== user.userId);
  const entry: ViewedUserEntry = { ...user, viewedAt: Date.now() };
  const updated = [entry, ...filtered].slice(0, VIEWED_USERS_MAX);
  localStorage.setItem(getStorageKey(currentUserId), JSON.stringify(updated));
}

/** 閲覧ユーザー履歴を全消去する */
export function clearViewedUsers(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getStorageKey(userId));
}
