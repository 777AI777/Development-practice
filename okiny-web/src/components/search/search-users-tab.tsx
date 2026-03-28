"use client";

import { useCallback, useEffect, useRef } from "react";
import { UserCard } from "@/components/user-card";
import { usePageTransition } from "@/components/page-transition-provider";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useSearch } from "@/hooks/use-search";
import {
  SEARCH_LIMIT,
  SEARCH_USERS_SCROLL_KEY,
} from "@/lib/constants";
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
    isInitialized,
    loadMore,
    reset,
  } = useSearch<UserSearchResult>({
    fetcher: fetchUsers,
    namespace: "users",
  });
  const normalizedQuery = query.trim();
  const { signalReady } = usePageTransition();

  // --- タブ切替で search() が再発火しないよう ref で管理 ---
  const isActiveRef = useRef(isActive);
  const pendingQueryRef = useRef<string | null>(null);

  useEffect(() => {
    isActiveRef.current = isActive;

    // タブがアクティブになったとき、保留中のクエリがあれば実行
    if (isActive && pendingQueryRef.current !== null) {
      const pending = pendingQueryRef.current;
      pendingQueryRef.current = null;
      search(pending);
    }
  }, [isActive, search]);

  const searchIfActive = useCallback(
    (q: string) => {
      if (isActiveRef.current) {
        search(q);
      } else {
        pendingQueryRef.current = q;
      }
    },
    [search],
  );

  useEffect(() => {
    if (!normalizedQuery) {
      reset();
      pendingQueryRef.current = null;
      return;
    }

    searchIfActive(normalizedQuery);
  }, [normalizedQuery, reset, searchIfActive]);

  useEffect(() => {
    if (!isActive) return;

    if (!normalizedQuery) {
      signalReady();
      return;
    }

    if (isInitialized && !isLoading) {
      signalReady();
    }
  }, [isActive, normalizedQuery, isInitialized, isLoading, signalReady]);

  // --- スクロール復元 ---
  const scrollRestoredRef = useRef(false);

  // scrollイベントで常時保存（throttle 200ms）
  useEffect(() => {
    if (!isActive || items.length === 0) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        sessionStorage.setItem(SEARCH_USERS_SCROLL_KEY, String(window.scrollY));
        timeoutId = null;
      }, 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isActive, items.length]);

  // データ復元後にスクロール位置を復元
  useEffect(() => {
    if (!isActive || !isInitialized || isLoading || items.length === 0) return;
    if (scrollRestoredRef.current) return;

    scrollRestoredRef.current = true;
    const saved = sessionStorage.getItem(SEARCH_USERS_SCROLL_KEY);
    if (saved !== null) {
      sessionStorage.removeItem(SEARCH_USERS_SCROLL_KEY);
      const scrollY = Number(saved);
      if (Number.isFinite(scrollY)) {
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollY);
        });
      }
    }
  }, [isActive, isInitialized, isLoading, items.length]);

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
      <p className="py-8 text-center text-sm text-muted-foreground">
        検索中...
      </p>
    );
  }

  if (error) {
    return (
      <div className="mx-4 my-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <button
          type="button"
          onClick={() => search(normalizedQuery)}
          className="mt-2 text-sm text-primary hover:underline"
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
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          )}
        </div>
      )}
    </div>
  );
}
