"use client";

import { useEffect } from "react";
import { UserCard } from "@/components/user-card";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useSearch } from "@/hooks/use-search";
import { SEARCH_LIMIT } from "@/lib/constants";
import type { UserSearchResult } from "@/lib/types";

interface SearchUsersTabProps {
  query: string;
  isActive: boolean;
}

async function fetchUsers(
  query: string,
  cursor: string | null,
  signal: AbortSignal,
): Promise<{ items: UserSearchResult[]; nextCursor: string | null }> {
  const params = new URLSearchParams({ q: query, limit: String(SEARCH_LIMIT) });
  if (cursor) {
    params.set("cursor", cursor);
  }

  const res = await fetch(`/api/v1/search/users?${params}`, { signal });
  if (!res.ok) {
    throw new Error("Failed to search users");
  }

  const json = await res.json();
  return json.data;
}

export function SearchUsersTab({
  query,
  isActive,
}: SearchUsersTabProps) {
  const {
    search,
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    reset,
  } = useSearch<UserSearchResult>({ fetcher: fetchUsers });
  const normalizedQuery = query.trim();

  useEffect(() => {
    if (!normalizedQuery) {
      reset();
      return;
    }

    if (isActive) {
      search(normalizedQuery);
    }
  }, [isActive, normalizedQuery, reset, search]);

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    isLoading: isLoadingMore,
    hasMore,
  });

  if (!isActive) {
    return null;
  }

  if (isLoading) {
    return (
      <p className="py-8 text-center text-xs text-muted-foreground">
        検索中...
      </p>
    );
  }

  if (error) {
    return (
      <div className="mx-4 my-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center">
        <p className="text-xs text-destructive">{error}</p>
        <button
          type="button"
          onClick={() => search(normalizedQuery)}
          className="mt-2 text-xs text-primary hover:underline"
        >
          再試行
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          「{normalizedQuery}」に一致するアカウントは見つかりませんでした
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-xl bg-card">
        {items.map((user, idx) => (
          <UserCard
            key={user.id}
            user={user}
            showBorder={idx < items.length - 1}
          />
        ))}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="py-4 text-center">
          {isLoadingMore && (
            <p className="text-xs text-muted-foreground">読み込み中...</p>
          )}
        </div>
      )}
    </div>
  );
}
