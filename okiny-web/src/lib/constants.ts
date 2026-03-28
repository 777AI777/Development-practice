export const TAG_QUERY_LIMITS = {
  MINE: 10,
  POPULAR: 10,
  SEARCH: 10,
} as const;

export const POPULAR_TAGS_CACHE_REVALIDATE_SECONDS = 60 * 30;

export const RANKING_ITEMS_PREVIEW_LIMIT = 5;

// --- Search Constants ---

export const SEARCH_LIMIT = 20;

export const SEARCH_DEBOUNCE_MS = 300;

export const SEARCH_QUERY_MIN_LENGTH = 1;

export const SEARCH_QUERY_MAX_LENGTH = 50;

export const SEARCH_HISTORY_MAX = 10;

export const VIEWED_USERS_MAX = 10;

export const SEARCH_HISTORY_KEY = "okiny:search_history";

export const VIEWED_USERS_KEY = "okiny:viewed_users";

// --- Following Feed Constants ---

export const FOLLOWING_FEED_LIMIT = 20;
