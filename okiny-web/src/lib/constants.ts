export const TAG_QUERY_LIMITS = {
  MINE: 10,
  POPULAR: 10,
  SEARCH: 10,
} as const;

export const POPULAR_TAGS_CACHE_REVALIDATE_SECONDS = 60 * 30;

export const RANKING_ITEMS_PREVIEW_LIMIT = 5;

// --- Search Constants ---

export const SEARCH_LIMIT = 10;

export const SEARCH_DEBOUNCE_MS = 300;

export const SEARCH_QUERY_MIN_LENGTH = 1;

export const SEARCH_QUERY_MAX_LENGTH = 50;

export const SEARCH_HISTORY_MAX = 10;

export const VIEWED_USERS_MAX = 10;

export const SEARCH_HISTORY_KEY = "okiny:search_history";

export const VIEWED_USERS_KEY = "okiny:viewed_users";

// --- Search Cache Constants ---

export const SEARCH_RANKINGS_CACHE_KEY = "okiny:search-rankings";

export const SEARCH_RANKINGS_SCROLL_KEY = "scroll:search-rankings";

export const SEARCH_USERS_CACHE_KEY = "okiny:search-users";

export const SEARCH_USERS_SCROLL_KEY = "scroll:search-users";

export const SEARCH_CACHE_TTL_MS = 30 * 60 * 1000; // 30分

// --- Scroll Restore Keys ---

export const SCROLL_KEY_FOLLOW_USERS = "scroll:follow-users";

export const SCROLL_KEY_RANKINGS_LIST = "scroll:rankings-list";

export const SCROLL_KEY_BOOKMARKS = "scroll:bookmarks";

// --- MyRank Cache Constants ---

export const MYRANK_CACHE_KEY = "okiny:myrank";

// --- Bookmarks Cache Constants ---

export const BOOKMARKS_CACHE_KEY = "okiny:bookmarks";

// --- Following Feed Constants ---

export const FOLLOWING_FEED_LIMIT = 10;
