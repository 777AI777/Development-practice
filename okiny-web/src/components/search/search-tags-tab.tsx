"use client";

import { useEffect } from "react";
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
  const { searchResults, isLoading, fetchTags, search, clearSearch } =
    useTags();

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    if (isActive && query) {
      search(query);
    } else {
      clearSearch();
    }
  }, [query, isActive, search, clearSearch]);

  if (!isActive) return null;

  if (isLoading) {
    return (
      <p className="py-8 text-center text-xs text-muted-foreground">
        検索中...
      </p>
    );
  }

  const displayResults = query.trim() ? searchResults : [];

  if (displayResults.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          「{query}」に一致するタグは見つかりませんでした
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {displayResults.length > 0 && (
        <section>
          <h3 className="px-4 text-xs font-medium text-muted-foreground">
            検索結果
          </h3>
          <div className="mt-2 flex flex-wrap gap-2 px-4">
            {displayResults.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => onTagSelect(tag.name)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition hover:bg-muted"
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
