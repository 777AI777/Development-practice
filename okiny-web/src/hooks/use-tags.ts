"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TagItem } from "@/lib/types";
import { deduplicateByKey } from "@/lib/tag-mappers";

interface UseTagsReturn {
  tags: TagItem[];
  searchResults: TagItem[];
  isLoading: boolean;
  fetchTags: () => Promise<void>;
  search: (query: string) => void;
  clearSearch: () => void;
}

/**
 * モジュールレベルキャッシュ: bootstrap タグデータ。
 * React StrictMode の二重 effect や複数 hook インスタンスによる重複リクエストを防ぐ。
 */
let bootstrapCache: { data: TagItem[]; fetchedAt: number } | null = null;
let bootstrapInflight: Promise<TagItem[]> | null = null;
const BOOTSTRAP_CACHE_TTL_MS = 5 * 60 * 1000; // 5 分

export function useTags(): UseTagsReturn {
  const [tags, setTags] = useState<TagItem[]>(() => bootstrapCache?.data ?? []);
  const [searchResults, setSearchResults] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, TagItem[]>>(new Map());

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      abortRef.current?.abort();
    };
  }, []);

  const fetchTags = useCallback(async () => {
    // キャッシュが有効ならそのまま返す
    if (bootstrapCache && Date.now() - bootstrapCache.fetchedAt < BOOTSTRAP_CACHE_TTL_MS) {
      setTags(bootstrapCache.data);
      return;
    }

    setIsLoading(true);
    try {
      // 同時リクエストの重複排除: 既に飛んでいるリクエストがあれば待つ
      if (!bootstrapInflight) {
        bootstrapInflight = fetch("/api/v1/tags/bootstrap")
          .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch tags");
            return res.json();
          })
          .then((json) => {
            const merged = deduplicateByKey(
              (json.data ?? []) as TagItem[],
              (tag) => tag.id,
            );
            bootstrapCache = { data: merged, fetchedAt: Date.now() };
            return merged;
          })
          .finally(() => {
            bootstrapInflight = null;
          });
      }

      const result = await bootstrapInflight;
      setTags(result ?? []);
    } catch {
      setTags([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const search = useCallback((query: string) => {
    const trimmedQuery = query.trim();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = undefined;
    }
    abortRef.current?.abort();
    abortRef.current = null;

    if (!trimmedQuery) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    const cached = cacheRef.current.get(trimmedQuery);
    if (cached) {
      setSearchResults(cached);
      setIsLoading(false);
      return;
    }

    setSearchResults([]);
    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `/api/v1/tags/search?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          throw new Error("Failed to search tags");
        }

        const json = await res.json();
        const results = (json.data ?? []) as TagItem[];
        cacheRef.current.set(trimmedQuery, results);
        setSearchResults(results);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
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
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = undefined;
    }
    abortRef.current?.abort();
    abortRef.current = null;
    setSearchResults([]);
    setIsLoading(false);
  }, []);

  return {
    tags,
    searchResults,
    isLoading,
    fetchTags,
    search,
    clearSearch,
  };
}

export function separateTags(tags: TagItem[]): {
  myTags: TagItem[];
  popularTags: TagItem[];
} {
  const myTags = tags.filter((tag) => tag.myUsageCount > 0);
  const popularTags = tags.filter((tag) => tag.myUsageCount === 0);
  return { myTags, popularTags };
}

export function getRecommendedTags(
  allTags: TagItem[],
  excludeTagIds: Set<string>,
): TagItem[] {
  return allTags
    .filter((tag) => !excludeTagIds.has(tag.id))
    .sort((a, b) => {
      if (a.myUsageCount > 0 && b.myUsageCount === 0) return -1;
      if (a.myUsageCount === 0 && b.myUsageCount > 0) return 1;
      return b.usageCount - a.usageCount;
    });
}
