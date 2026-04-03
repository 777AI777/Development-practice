/** キャッシュ設定 */
export interface ListCacheConfig {
  /** sessionStorageのキー（例: "okiny:following-feed"） */
  cacheKey: string;
  /** TTL（ミリ秒）。デフォルト: 60 * 60 * 1000 (1時間) */
  ttlMs?: number;
}

/** キャッシュに保存されるエントリ */
export interface ListCacheEntry<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** sessionStorageに保存される形式（内部用） */
interface StoredListCache {
  items: unknown[];
  nextCursor: string | null;
  hasMore: boolean;
  cachedAt: number;
}

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1時間

function isStoredListCache(data: unknown): data is StoredListCache {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    Array.isArray(obj.items) &&
    (typeof obj.nextCursor === "string" || obj.nextCursor === null) &&
    typeof obj.hasMore === "boolean" &&
    typeof obj.cachedAt === "number"
  );
}

/** キャッシュ無効化イベント名を生成 */
export function getInvalidationEventName(cacheKey: string): string {
  return `${cacheKey}:invalidated`;
}

/** sessionStorageからキャッシュ読み取り（TTLチェック付き） */
export function getListCache<T>(config: ListCacheConfig): ListCacheEntry<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const json = sessionStorage.getItem(config.cacheKey);
    if (!json) return null;
    const parsed: unknown = JSON.parse(json);
    if (!isStoredListCache(parsed)) return null;
    const ttl = config.ttlMs ?? DEFAULT_TTL_MS;
    if (Date.now() - parsed.cachedAt > ttl) {
      sessionStorage.removeItem(config.cacheKey);
      return null;
    }
    return {
      items: parsed.items as T[],
      nextCursor: parsed.nextCursor,
      hasMore: parsed.hasMore,
    };
  } catch {
    return null;
  }
}

/** sessionStorageにキャッシュ書き込み */
export function setListCache<T>(config: ListCacheConfig, entry: ListCacheEntry<T>): void {
  if (typeof window === "undefined") return;
  if (entry.items.length === 0) return;
  try {
    sessionStorage.setItem(
      config.cacheKey,
      JSON.stringify({
        items: entry.items,
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
export function touchListCache(config: ListCacheConfig): void {
  if (typeof window === "undefined") return;
  try {
    const json = sessionStorage.getItem(config.cacheKey);
    if (!json) return;
    const parsed: unknown = JSON.parse(json);
    if (!isStoredListCache(parsed)) return;
    sessionStorage.setItem(
      config.cacheKey,
      JSON.stringify({ ...parsed, cachedAt: Date.now() }),
    );
  } catch {
    // ignore
  }
}

/** キャッシュ削除 + CustomEvent発火 */
export function clearListCache(config: ListCacheConfig): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(config.cacheKey);
  } catch {
    // ignore
  }
  window.dispatchEvent(
    new CustomEvent(getInvalidationEventName(config.cacheKey)),
  );
}
