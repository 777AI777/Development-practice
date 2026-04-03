"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePageTransition } from "@/components/page-transition-provider";
import {
  getSearchHistory,
  removeSearchHistory,
  clearSearchHistory,
} from "@/lib/search-history";
import { getViewedUsers, clearViewedUsers } from "@/lib/viewed-users";
import type { TagItem, ViewedUserEntry } from "@/lib/types";
import { getUserInitial } from "@/lib/user-utils";

interface SearchInitialViewProps {
  userId: string;
  isUserReady: boolean;
  isTagsLoading: boolean;
  myTags: TagItem[];
  popularTags: TagItem[];
  onSearchQuery: (query: string) => void;
  onTagSelect: (tagName: string) => void;
}

export function SearchInitialView({
  userId,
  isUserReady,
  isTagsLoading,
  myTags,
  popularTags,
  onSearchQuery,
  onTagSelect,
}: SearchInitialViewProps) {
  const { signalReady } = usePageTransition();
  const [history, setHistory] = useState<string[]>([]);
  const [viewedUsers, setViewedUsers] = useState<ViewedUserEntry[]>([]);
  const [hasLoadedClientState, setHasLoadedClientState] = useState(false);

  useEffect(() => {
    if (!isUserReady) {
      setHasLoadedClientState(false);
      return;
    }

    setHistory(getSearchHistory(userId));
    setViewedUsers(getViewedUsers(userId));
    setHasLoadedClientState(true);
  }, [isUserReady, userId]);

  useEffect(() => {
    if (!isUserReady || !hasLoadedClientState || isTagsLoading) {
      return;
    }

    signalReady();
  }, [hasLoadedClientState, isTagsLoading, isUserReady, signalReady]);

  const handleRemoveHistory = useCallback(
    (query: string) => {
      removeSearchHistory(userId, query);
      setHistory(getSearchHistory(userId));
    },
    [userId],
  );

  const handleClearHistory = useCallback(() => {
    clearSearchHistory(userId);
    setHistory([]);
  }, [userId]);

  const handleClearViewedUsers = useCallback(() => {
    clearViewedUsers(userId);
    setViewedUsers([]);
  }, [userId]);

  return (
    <div className="space-y-6 pb-4">
      {history.length > 0 && (
        <section>
          <div className="flex items-center justify-between px-4">
            <h3 className="text-lg font-medium text-foreground">検索履歴</h3>
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-sm text-primary hover:underline"
            >
              すべて消去
            </button>
          </div>
          <div className="mt-1 flex flex-col gap-0.5 px-4">
            {history.map((query) => (
              <div key={query} className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onSearchQuery(query)}
                  className="text-base text-muted-foreground transition hover:text-foreground"
                >
                  {query}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveHistory(query)}
                  className="flex h-4 w-4 items-center justify-center text-muted-foreground/50 transition hover:text-muted-foreground"
                  aria-label={`${query}を削除`}
                >
                  <span className="text-xs leading-none">{"\u2715"}</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {viewedUsers.length > 0 && (
        <section>
          <div className="flex items-center justify-between px-4">
            <h3 className="text-lg font-medium text-foreground">
              最近見たユーザー
            </h3>
            <button
              type="button"
              onClick={handleClearViewedUsers}
              className="text-sm text-primary hover:underline"
            >
              すべて消去
            </button>
          </div>
          <div className="mt-2 flex gap-3 overflow-x-auto px-4 pb-2">
            {viewedUsers.map((user) => (
              <Link
                key={user.userId}
                href={
                  user.displayUserId
                    ? `/users/${user.displayUserId}`
                    : `/users/${user.userId}`
                }
                className="flex w-16 shrink-0 flex-col items-center gap-1"
              >
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.displayName}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {getUserInitial(user.displayName, "?")}
                  </div>
                )}
                <span className="w-full truncate text-center text-xs text-muted-foreground">
                  {user.displayName}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {myTags.length > 0 && (
        <section>
          <h3 className="px-4 text-lg font-medium text-foreground">
            よく使うタグ
          </h3>
          <div className="mt-2 flex flex-col items-start gap-2 px-4">
            {myTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => onTagSelect(tag.name)}
                className="text-base text-muted-foreground transition hover:text-foreground"
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {popularTags.length > 0 && (
        <section>
          <h3 className="px-4 text-lg font-medium text-foreground">
            人気のタグ
          </h3>
          <div className="mt-2 flex flex-col items-start gap-2 px-4">
            {popularTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => onTagSelect(tag.name)}
                className="text-base text-muted-foreground transition hover:text-foreground"
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
