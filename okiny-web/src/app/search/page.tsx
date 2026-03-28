"use client";

import { Suspense, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useSessionUser } from "@/hooks/use-session-user";
import { useTags, separateTags } from "@/hooks/use-tags";
import { addSearchHistory } from "@/lib/search-history";
import { SearchTabs } from "@/components/search/search-tabs";
import { SearchInitialView } from "@/components/search/search-initial-view";
import { usePageTransition } from "@/components/page-transition-provider";
import { SearchRankingsTab } from "@/components/search/search-rankings-tab";
import { SearchUsersTab } from "@/components/search/search-users-tab";
import { SearchTagsTab } from "@/components/search/search-tags-tab";
import type { SearchTab } from "@/lib/types";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isReady: isUserReady } = useSessionUser();

  const q = searchParams.get("q") ?? "";
  const tabParam = searchParams.get("tab") as SearchTab | null;
  const activeTab: SearchTab =
    tabParam && ["rankings", "accounts", "tags"].includes(tabParam)
      ? tabParam
      : "rankings";

  const { tags, fetchTags, isLoading: isTagsLoading } = useTags();
  const { myTags, popularTags } = separateTags(tags);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const lastAddedQueryRef = useRef<string>("");
  useEffect(() => {
    if (q && user?.id && q !== lastAddedQueryRef.current) {
      addSearchHistory(user.id, q);
      lastAddedQueryRef.current = q;
    }
  }, [q, user?.id]);

  const handleTabChange = useCallback(
    (tab: SearchTab) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("tab", tab);
      router.replace(`/search?${params.toString()}`);
    },
    [q, router],
  );

  const handleSearchQuery = useCallback(
    (query: string) => {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    },
    [router],
  );

  const handleTagSelect = useCallback(
    (tagName: string) => {
      router.push(`/search?q=${encodeURIComponent(tagName)}&tab=rankings`);
    },
    [router],
  );

  const hasQuery = q.trim().length > 0;
  const { signalReady } = usePageTransition();

  // 検索結果表示時は signalReady を呼んでローディングバーを解除する
  // （SearchInitialView はクエリなし時のみ signalReady を呼ぶため）
  useEffect(() => {
    if (hasQuery) {
      signalReady();
    }
  }, [hasQuery, signalReady]);

  return (
    <AppShell>
      {hasQuery ? (
        <div className="-mx-4 -mt-4">
          <SearchTabs activeTab={activeTab} onTabChange={handleTabChange} />
          <div className="px-4 pb-4">
            <SearchRankingsTab
              query={q}
              isActive={activeTab === "rankings"}
            />
            <SearchUsersTab
              query={q}
              isActive={activeTab === "accounts"}
            />
            <SearchTagsTab
              query={q}
              isActive={activeTab === "tags"}
              onTagSelect={handleTagSelect}
            />
          </div>
        </div>
      ) : (
        <div className="-mt-4">
          <SearchInitialView
            userId={user?.id ?? ""}
            isUserReady={isUserReady}
            isTagsLoading={isTagsLoading}
            myTags={myTags}
            popularTags={popularTags}
            onSearchQuery={handleSearchQuery}
            onTagSelect={handleTagSelect}
          />
        </div>
      )}
    </AppShell>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageContent />
    </Suspense>
  );
}
