import type { SupabaseTagRow, TagItem } from "@/lib/types";

/**
 * SupabaseTagRow → TagItem変換
 */
export function toTagItem(row: SupabaseTagRow, myUsageCount = 0): TagItem {
  return {
    id: row.id,
    name: row.name,
    readings: row.readings,
    usageCount: row.usage_count ?? 0,
    myUsageCount,
    createdAt: row.created_at,
  };
}

/**
 * getUserTagUsage RPC結果 → TagItem変換
 */
export function rpcRowToTagItem(row: {
  tag_id: string;
  tag_name: string;
  tag_readings: string[];
  tag_usage_count: number;
  tag_created_at: string;
  my_usage_count: number;
}): TagItem {
  return {
    id: row.tag_id,
    name: row.tag_name,
    readings: row.tag_readings,
    usageCount: row.tag_usage_count,
    myUsageCount: row.my_usage_count,
    createdAt: row.tag_created_at,
  };
}

/**
 * keyFnで重複排除（先頭優先）
 */
export function deduplicateByKey<T>(
  items: readonly T[],
  keyFn: (item: T) => string,
): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}
