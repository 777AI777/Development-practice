"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePageTransition } from "@/components/page-transition-provider";
import { useTags } from "@/hooks/use-tags";

interface SearchTagsTabProps {
  query: string;
  isActive: boolean;
  onTagSelect: (tagName: string) => void;
}

export function SearchTagsTab({
  query,
  isActive,
  onTagSelect,
}: SearchTagsTabProps) {
  const { searchResults, isLoading, isSearchInitialized, search, clearSearch } = useTags();
  const normalizedQuery = query.trim();
  const { startTransitionLoading, signalReady } = usePageTransition();
  const transitionActiveRef = useRef(false);

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
      clearSearch();
      pendingQueryRef.current = null;
      return;
    }

    searchIfActive(normalizedQuery);
  }, [clearSearch, normalizedQuery, searchIfActive]);

  useEffect(() => {
    if (!isActive) return;

    if (isLoading && normalizedQuery) {
      transitionActiveRef.current = true;
      startTransitionLoading();
    }
  }, [isActive, isLoading, normalizedQuery, startTransitionLoading]);

  useEffect(() => {
    if (!isActive) return;

    if (!normalizedQuery) {
      if (transitionActiveRef.current) {
        transitionActiveRef.current = false;
        signalReady();
      }
      return;
    }

    if (isSearchInitialized && !isLoading) {
      if (transitionActiveRef.current) {
        transitionActiveRef.current = false;
        signalReady();
      }
    }
  }, [isActive, normalizedQuery, isSearchInitialized, isLoading, signalReady]);

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

  const displayResults = normalizedQuery ? searchResults : [];

  if (displayResults.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          「{normalizedQuery}」に一致するタグは見つかりませんでした
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <section>
        <h3 className="px-4 text-sm font-medium text-muted-foreground">
          検索結果
        </h3>
        <div className="mt-2 flex flex-wrap gap-2 px-4">
          {displayResults.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onTagSelect(tag.name)}
              className="text-sm text-primary transition hover:text-primary/70"
            >
              #{tag.name}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
