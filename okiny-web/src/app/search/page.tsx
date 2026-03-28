"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { BookmarkButton } from "@/components/bookmark-button";
import { usePageTransition } from "@/components/page-transition-provider";
import { useToast } from "@/components/toast-provider";
import { useSessionUser } from "@/hooks/use-session-user";
import { useTags, separateTags, getRecommendedTags } from "@/hooks/use-tags";
import { TAG_QUERY_LIMITS } from "@/lib/constants";
import { formatSmartDate } from "@/lib/format-date";
import { HttpPublishedApiClient, PublishedApiError } from "@/lib/publish/http-published-api-client";
import { buildSessionExpiredToast } from "@/lib/session-expired-toast";
import type { PublicRankingWithAuthor, TagItem } from "@/lib/types";
import { buildUserProfilePath, getUserInitial } from "@/lib/user-utils";

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

  const { user, isReady: isUserReady } = useSessionUser();
  const { pushToast } = useToast();
  const { signalReady } = usePageTransition();
  const { tags, searchResults, isLoading: isTagsLoading, fetchTags, search, clearSearch } = useTags();

  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null);

  // Sync selectedTag from URL searchParams (mount + browser back/forward)
  const urlTagId = searchParams.get("tagId");
  const urlTagName = searchParams.get("tagName");
  const prevUrlTagIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only react when urlTagId actually changes (avoids loops with handleTagSelect)
    if (urlTagId === prevUrlTagIdRef.current) return;
    prevUrlTagIdRef.current = urlTagId;

    if (urlTagId && urlTagName) {
      setSelectedTag((prev) => {
        // Avoid unnecessary state update if already selected
        if (prev?.id === urlTagId) return prev;
        return { id: urlTagId, name: urlTagName, readings: [], usageCount: 0, myUsageCount: 0, createdAt: "" };
      });
    } else {
      setSelectedTag(null);
    }
  }, [urlTagId, urlTagName]);

  const [isRankingsLoading, setIsRankingsLoading] = useState(false);
  const [results, setResults] = useState<PublicRankingWithAuthor[]>([]);
  const [rankingsError, setRankingsError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hasStartedLoading, setHasStartedLoading] = useState(false);

  // Fetch all tags on mount (for sections / recommendations)
  useEffect(() => {
    setHasStartedLoading(true);
    fetchTags();
  }, [fetchTags]);

  // Signal ready once tags have loaded (after fetch has started)
  useEffect(() => {
    if (!selectedTag && hasStartedLoading && !isTagsLoading) {
      signalReady();
    }
  }, [hasStartedLoading, isTagsLoading, selectedTag, signalReady]);

  // React to q changes from header search
  const prevQRef = useRef(q);
  useEffect(() => {
    const qChanged = q !== prevQRef.current;
    prevQRef.current = q;

    if (q) {
      search(q);
    } else {
      clearSearch();
    }

    // Only clear selectedTag when the user actively changed the search query,
    // NOT when returning via browser back (which may carry both q and tagId).
    if (qChanged) {
      const currentTagId = searchParams.get("tagId");
      if (currentTagId) {
        // User typed a new query while a tag was selected — clear tag params
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.delete("tagId");
        nextParams.delete("tagName");
        const qs = nextParams.toString();
        router.replace(qs ? `/search?${qs}` : "/search");
      }
      setSelectedTag(null);
      setResults([]);
    }
  }, [q, search, clearSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch rankings when tag selected
  useEffect(() => {
    if (!selectedTag) {
      setResults([]);
      setRankingsError(null);
      setIsRankingsLoading(false);
      return;
    }

    if (!isUserReady) {
      setIsRankingsLoading(true);
      return;
    }

    if (!user) {
      setResults([]);
      setRankingsError(null);
      setIsRankingsLoading(false);
      return;
    }

    let canceled = false;
    setIsRankingsLoading(true);
    setRankingsError(null);

    void apiClient
      .listPublicRankingsByTag(selectedTag.id)
      .then((data) => {
        if (canceled) return;
        setResults(data);
        setRankingsError(null);
      })
      .catch((error: unknown) => {
        if (canceled) return;
        if (error instanceof PublishedApiError && error.code === "UNAUTHORIZED") {
          pushToast(buildSessionExpiredToast());
          setRankingsError("セッションが切れました。");
          return;
        }
        const message =
          error instanceof PublishedApiError ? error.message : "ランキングの取得に失敗しました";
        setRankingsError(message);
        pushToast({ type: "error", message });
      })
      .finally(() => {
        if (canceled) return;
        setIsRankingsLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [pushToast, selectedTag, user, isUserReady, retryCount]);

  useEffect(() => {
    if (selectedTag && isUserReady && !isRankingsLoading) {
      signalReady();
    }
  }, [selectedTag, isUserReady, isRankingsLoading, signalReady]);

  // Retry handler for rankings fetch
  const handleRetryRankings = () => {
    setRetryCount((prev) => prev + 1);
  };

  // Helper: update URL searchParams without polluting browser history
  const updateSearchParams = (params: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value === null) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    }
    const qs = nextParams.toString();
    router.replace(qs ? `/search?${qs}` : "/search");
  };

  // Tag click handler
  const handleTagSelect = (tag: TagItem) => {
    const isDeselect = selectedTag?.id === tag.id;
    const nextTag = isDeselect ? null : tag;
    setSelectedTag(nextTag);

    // Keep ref in sync so the URL-sync useEffect won't re-trigger
    prevUrlTagIdRef.current = nextTag?.id ?? null;

    if (nextTag) {
      updateSearchParams({ tagId: nextTag.id, tagName: nextTag.name });
    } else {
      updateSearchParams({ tagId: null, tagName: null });
    }
  };

  // Back button handler
  const handleBack = () => {
    if (selectedTag) {
      setSelectedTag(null);
      prevUrlTagIdRef.current = null;
      updateSearchParams({ tagId: null, tagName: null });
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
            error={rankingsError}
            onRetry={handleRetryRankings}
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

/** State 5: Selected tag — show public rankings from other users */
function SelectedTagView({
  selectedTag,
  isLoading,
  results,
  error,
  onRetry,
}: {
  selectedTag: TagItem;
  isLoading: boolean;
  results: PublicRankingWithAuthor[];
  error: string | null;
  onRetry: () => void;
}) {
  const router = useRouter();

  // インプレッション記録（fire-and-forget）
  const impressionSentRef = useRef(false);
  useEffect(() => {
    if (isLoading || results.length === 0 || impressionSentRef.current) return;
    impressionSentRef.current = true;
    const ids = results.map((r) => r.id);
    apiClient.recordImpressions(ids).catch(() => {});
  }, [isLoading, results]);

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">読み込み中...</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          このタグの公開ランキングはまだありません。
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

  const handleAvatarClick = (
    e: React.MouseEvent,
    author: PublicRankingWithAuthor["author"],
  ) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(buildUserProfilePath(author));
  };

  return (
    <div className="overflow-hidden rounded-xl bg-card">
      {results.map((ranking, idx) => {
        const authorInitial = getUserInitial(ranking.author.displayName, "?");
        return (
          <Link
            key={ranking.id}
            href={`/rankings/${ranking.id}`}
            className="block transition hover:bg-muted/50"
            style={{ borderBottom: idx < results.length - 1 ? "1px solid var(--border)" : "none" }}
          >
            <div className="p-4 flex items-start gap-3">
              <button
                type="button"
                onClick={(e) => handleAvatarClick(e, ranking.author)}
                className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`${ranking.author.displayName}のプロフィール`}
              >
                {ranking.author.avatarUrl ? (
                  <Image
                    src={ranking.author.avatarUrl}
                    alt={ranking.author.displayName}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {authorInitial}
                  </div>
                )}
              </button>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-foreground">
                    {ranking.author.displayName}
                  </span>
                  {ranking.author.displayUserId ? (
                    <span className="text-xs text-muted-foreground">
                      @{ranking.author.displayUserId}
                    </span>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    · {formatSmartDate(ranking.createdAt)}
                  </span>
                </div>
                <h3 className="font-semibold text-[15px] text-foreground">
                  {ranking.title}
                </h3>
                <div className="space-y-0">
                  {ranking.items.slice(0, 5).map((item, itemIdx) => (
                    <p
                      key={`${ranking.id}-item-${itemIdx}`}
                      className="text-sm leading-relaxed text-muted-foreground"
                    >
                      {itemIdx + 1}. {item || "未入力"}
                    </p>
                  ))}
                </div>
                {/* 統計 */}
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {ranking.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    {ranking.impressionCount}
                  </span>
                  <BookmarkButton
                    rankingId={ranking.id}
                    initialIsBookmarked={ranking.isBookmarked}
                    bookmarkCount={ranking.bookmarkCount}
                    compact
                    className="-my-1 -ml-1"
                  />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
