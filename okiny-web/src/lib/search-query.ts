const SEARCH_TAG_PREFIX_RE = /^[#＃]/;

export function normalizeSearchQuery(query: string): string {
  return query.trim().replace(SEARCH_TAG_PREFIX_RE, "");
}
