import { SEARCH_HISTORY_KEY, SEARCH_HISTORY_MAX } from "./constants";

function getStorageKey(userId: string): string {
  return `${SEARCH_HISTORY_KEY}:${userId}`;
}

/** 検索履歴を取得する */
export function getSearchHistory(userId: string): string[] {
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

/** 検索履歴に追加する（先頭追加、重複排除、最大10件） */
export function addSearchHistory(userId: string, query: string): void {
  if (typeof window === "undefined") return;
  const trimmed = query.trim();
  if (!trimmed) return;
  const current = getSearchHistory(userId);
  const filtered = current.filter((q) => q !== trimmed);
  const updated = [trimmed, ...filtered].slice(0, SEARCH_HISTORY_MAX);
  localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
}

/** 検索履歴から1件削除する */
export function removeSearchHistory(userId: string, query: string): void {
  if (typeof window === "undefined") return;
  const current = getSearchHistory(userId);
  const updated = current.filter((q) => q !== query);
  localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
}

/** 検索履歴を全消去する */
export function clearSearchHistory(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getStorageKey(userId));
}
