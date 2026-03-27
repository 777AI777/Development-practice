"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { TagItem } from "@/lib/types";
import { deduplicateByKey } from "@/lib/tag-mappers";

interface UseTagsReturn {
  /** All tags (only populated after fetchTags is called) */
  tags: TagItem[];
  /** Search results */
  searchResults: TagItem[];
  /** Loading state */
  isLoading: boolean;
  /** Explicitly fetch all tags (call on focus, page load, etc.) */
  fetchTags: () => Promise<void>;
  /** Search tags by query (300ms debounce) */
  search: (query: string) => void;
  /** Clear search results */
  clearSearch: () => void;
}

export function useTags(): UseTagsReturn {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [searchResults, setSearchResults] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup debounce and abort on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const fetchTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mineResult, popularResult] = await Promise.allSettled([
        fetch("/api/v1/tags/mine").then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch my tags");
          const json = await res.json();
          return (json.data ?? []) as TagItem[];
        }),
        fetch("/api/v1/tags/popular").then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch popular tags");
          const json = await res.json();
          return (json.data ?? []) as TagItem[];
        }),
      ]);
      const mineTags =
        mineResult.status === "fulfilled" ? mineResult.value : [];
      const popularTags =
        popularResult.status === "fulfilled" ? popularResult.value : [];

      if (
        mineResult.status === "rejected" &&
        popularResult.status === "rejected"
      ) {
        console.error(
          "[use-tags] Both mine and popular tags failed:",
          mineResult.reason,
          popularResult.reason,
        );
      }

      const merged = deduplicateByKey(
        [...mineTags, ...popularTags],
        (t) => t.id,
      );
      setTags(merged);
    } catch {
      // unexpected error (should not reach here due to allSettled)
    } finally {
      setIsLoading(false);
    }
  }, []);

  const search = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = undefined;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (!query.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }
    setSearchResults([]);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/v1/tags/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("Failed to search tags");
        const json = await res.json();
        setSearchResults(json.data ?? []);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }
        setSearchResults([]);
      } finally {
        abortRef.current = null;
        setIsLoading(false);
      }
    }, 300);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = undefined;
    }
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  }, []);

  return { tags, searchResults, isLoading, fetchTags, search, clearSearch };
}

/**
 * タグを「よく使うタグ」と「人気のタグ」に分離する。
 * 自分が使用中のタグは「よく使うタグ」に分類され、「人気のタグ」には含まれない（重複防止）。
 */
export function separateTags(tags: TagItem[]): {
  myTags: TagItem[];
  popularTags: TagItem[];
} {
  const myTags = tags.filter((tag) => tag.myUsageCount > 0);
  const popularTags = tags.filter((tag) => tag.myUsageCount === 0);
  return { myTags, popularTags };
}

/** おすすめタグを生成する（検索結果のタグを除外、自分の使用タグ優先） */
export function getRecommendedTags(
  allTags: TagItem[],
  excludeTagIds: Set<string>,
): TagItem[] {
  return allTags
    .filter((tag) => !excludeTagIds.has(tag.id))
    .sort((a, b) => {
      // 自分の使用タグ優先
      if (a.myUsageCount > 0 && b.myUsageCount === 0) return -1;
      if (a.myUsageCount === 0 && b.myUsageCount > 0) return 1;
      // 同カテゴリ内はusageCount降順
      return b.usageCount - a.usageCount;
    });
}
