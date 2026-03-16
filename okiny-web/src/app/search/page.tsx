"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { usePageTransition } from "@/components/page-transition-provider";
import { useToast } from "@/components/toast-provider";
import { useSessionUser } from "@/hooks/use-session-user";
import { useTags, separateTags, getRecommendedTags } from "@/hooks/use-tags";
import { TAG_QUERY_LIMITS } from "@/lib/constants";
import { HttpPublishedApiClient, PublishedApiError } from "@/lib/publish/http-published-api-client";
import type { PublishedRanking, TagItem } from "@/lib/types";

const apiClient = new HttpPublishedApiClient();

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="text-muted-foreground">読み込み中...</div></div>}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const { user } = useSessionUser();
  const { pushToast } = useToast();
  const { signalReady } = usePageTransition();
  const { tags, searchResults, isLoading: isTagsLoading, fetchTags, search, clearSearch } = useTags();

  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null);
  const [isRankingsLoading, setIsRankingsLoading] = useState(false);
  const [results, setResults] = useState<PublishedRanking[]>([]);
  const [hasStartedLoading, setHasStartedLoading] = useState(false);

  // Fetch all tags on mount (for sections / recommendations)
  useEffect(() => {
    setHasStartedLoading(true);
    fetchTags();
  }, [fetchTags]);

  // Signal ready once tags have loaded (after fetch has started)
  useEffect(() => {
    if (hasStartedLoading && !isTagsLoading) {
      signalReady();
    }
  }, [hasStartedLoading, isTagsLoading, signalReady]);

  // React to q changes from header search
  useEffect(() => {
    if (q) {
      search(q);
    } else {
      clearSearch();
    }
    setSelectedTag(null);
    setResults([]);
  }, [q, search, clearSearch]);

  // Fetch rankings when tag selected
  useEffect(() => {
    if (!user || !selectedTag) {
      setResults([]);
      return;
    }

    let canceled = false;
    setIsRankingsLoading(true);

    void apiClient
      .listPublishedRankings(selectedTag.id)
      .then((data) => {
        if (canceled) return;
        setResults(data);
      })
      .catch((error: unknown) => {
        if (canceled) return;
        const message =
          error instanceof PublishedApiError ? error.message : "ランキング検索に失敗しました。";
        pushToast({ type: "error", message });
      })
      .finally(() => {
        if (canceled) return;
        setIsRankingsLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [pushToast, selectedTag, user]);

  // Tag click handler
  const handleTagSelect = (tag: TagItem) => {
    setSelectedTag((prev) => (prev?.id === tag.id ? null : tag));
  };

  // Back button handler
  const handleBack = () => {
    if (selectedTag) {
      setSelectedTag(null);
    } else if (q) {
      router.push("/search");
    } else {
      router.back();
    }
  };

  // Separate tags for initial view (State 1)
  const { myTags, popularTags } = useMemo(() => {
    const separated = separateTags(tags);
    return {
      myTags: separated.myTags.slice(0, TAG_QUERY_LIMITS.MINE),
      popularTags: separated.popularTags.slice(0, TAG_QUERY_LIMITS.POPULAR),
    };
  }, [tags]);

  // Recommended tags for search view (States 3/4)
  const matchedTagIds = useMemo(
    () => new Set(searchResults.map((t) => t.id)),
    [searchResults],
  );
  const recommendedTags = useMemo(
    () => getRecommendedTags(tags, matchedTagIds).slice(0, TAG_QUERY_LIMITS.MINE + TAG_QUERY_LIMITS.POPULAR),
    [tags, matchedTagIds],
  );

  // Page title
  const pageTitle = selectedTag
    ? selectedTag.name
    : q
      ? `「${q}」の検索結果`
      : "";

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header: back arrow + title */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center text-lg font-bold text-foreground"
            aria-label="戻る"
          >
            {"\u2190"}
          </button>
          {pageTitle && (
            <h1 className="truncate text-base font-semibold text-foreground">
              {pageTitle}
            </h1>
          )}
        </div>

        {/* Loading state */}
        {isTagsLoading ? (
          <p className="text-xs text-muted-foreground">読み込み中...</p>
        ) : selectedTag ? (
          /* ── State 5: Tag selected — show rankings ── */
          <SelectedTagView
            selectedTag={selectedTag}
            isLoading={isRankingsLoading}
            results={results}
          />
        ) : q ? (
          /* ── States 3/4: Search results ── */
          <SearchResultsView
            searchResults={searchResults.slice(0, TAG_QUERY_LIMITS.SEARCH)}
            recommendedTags={recommendedTags}
            onTagSelect={handleTagSelect}
            selectedTagId={null}
          />
        ) : (
          /* ── State 1: Initial view ── */
          <InitialView
            myTags={myTags}
            popularTags={popularTags}
            onTagSelect={handleTagSelect}
          />
        )}
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TagChip({
  tag,
  isSelected,
  onSelect,
}: {
  tag: TagItem;
  isSelected: boolean;
  onSelect: (tag: TagItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(tag)}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        isSelected
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
      }`}
    >
      {tag.name}
    </button>
  );
}

function TagChipList({
  tags,
  selectedTagId,
  onTagSelect,
}: {
  tags: TagItem[];
  selectedTagId: string | null;
  onTagSelect: (tag: TagItem) => void;
}) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <TagChip
          key={tag.id}
          tag={tag}
          isSelected={selectedTagId === tag.id}
          onSelect={onTagSelect}
        />
      ))}
    </div>
  );
}

/** State 1: Initial view — "よく使うタグ" + "人気のタグ" */
function InitialView({
  myTags,
  popularTags,
  onTagSelect,
}: {
  myTags: TagItem[];
  popularTags: TagItem[];
  onTagSelect: (tag: TagItem) => void;
}) {
  return (
    <>
      {myTags.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">よく使うタグ</h2>
          <TagChipList tags={myTags} selectedTagId={null} onTagSelect={onTagSelect} />
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-foreground">人気のタグ</h2>
        {popularTags.length > 0 ? (
          <TagChipList tags={popularTags} selectedTagId={null} onTagSelect={onTagSelect} />
        ) : (
          <p className="text-xs text-muted-foreground">タグがありません</p>
        )}
      </section>
    </>
  );
}

/** States 3/4: Search results + recommendations */
function SearchResultsView({
  searchResults,
  recommendedTags,
  onTagSelect,
  selectedTagId,
}: {
  searchResults: TagItem[];
  recommendedTags: TagItem[];
  onTagSelect: (tag: TagItem) => void;
  selectedTagId: string | null;
}) {
  const recentTags = recommendedTags.filter((t) => t.myUsageCount > 0);
  const popularRecommended = recommendedTags.filter((t) => t.myUsageCount === 0);

  return (
    <>
      {searchResults.length > 0 ? (
        <TagChipList
          tags={searchResults}
          selectedTagId={selectedTagId}
          onTagSelect={onTagSelect}
        />
      ) : (
        <p className="text-sm italic text-muted-foreground">
          一致するタグが見つかりません
        </p>
      )}

      {recentTags.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">最近</h2>
          <TagChipList
            tags={recentTags}
            selectedTagId={selectedTagId}
            onTagSelect={onTagSelect}
          />
        </section>
      )}
      {popularRecommended.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">人気</h2>
          <TagChipList
            tags={popularRecommended}
            selectedTagId={selectedTagId}
            onTagSelect={onTagSelect}
          />
        </section>
      )}
    </>
  );
}

/** State 5: Selected tag — show ranking cards */
function SelectedTagView({
  selectedTag,
  isLoading,
  results,
}: {
  selectedTag: TagItem;
  isLoading: boolean;
  results: PublishedRanking[];
}) {
  if (isLoading) {
    return <p className="text-xs text-muted-foreground">読み込み中...</p>;
  }

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          選択したタグのランキングは見つかりませんでした。
        </p>
        <Link
          href={`/rankings/new?tagId=${encodeURIComponent(selectedTag.id)}`}
          className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          このタグでランキングを作成
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((ranking) => (
        <Link
          key={ranking.id}
          href={`/rankings/${ranking.id}`}
          className="block rounded-xl bg-card p-4 transition-colors hover:bg-muted/50"
        >
          <p className="font-semibold text-foreground">{ranking.title}</p>
          <span className="mt-1 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {selectedTag.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
