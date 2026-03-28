"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";

interface UseSearchOptions<TItem> {
  /** APIからデータを取得する関数。cursorがnullなら最初のページ */
  fetcher: (
    query: string,
    cursor: string | null,
    signal: AbortSignal,
  ) => Promise<{ items: TItem[]; nextCursor: string | null }>;
  /** デバウンスミリ秒（デフォルト: SEARCH_DEBOUNCE_MS） */
  debounceMs?: number;
  /** 最小クエリ長（デフォルト: 1） */
  minQueryLength?: number;
}

interface UseSearchReturn<TItem> {
  /** 検索結果（ページネーションで累積） */
  items: TItem[];
  /** 初回ロード中 */
  isLoading: boolean;
  /** 追加ページロード中 */
  isLoadingMore: boolean;
  /** 次のページがあるか */
  hasMore: boolean;
  /** エラーメッセージ */
  error: string | null;
  /** 次のページを読み込む */
  loadMore: () => void;
  /** 結果をリセットする */
  reset: () => void;
}

export function useSearch<TItem>({
  fetcher,
  debounceMs = SEARCH_DEBOUNCE_MS,
  minQueryLength = 1,
}: UseSearchOptions<TItem>): {
  search: (query: string) => void;
} & UseSearchReturn<TItem> {
  const [items, setItems] = useState<TItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const cursorRef = useRef<string | null>(null);
  const queryRef = useRef<string>("");

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const fetchPage = useCallback(
    async (query: string, cursor: string | null, isMore: boolean) => {
      // 前のリクエストをキャンセル
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (isMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const result = await fetcher(query, cursor, controller.signal);

        if (isMore) {
          setItems((prev) => [...prev, ...result.items]);
        } else {
          setItems(result.items);
        }

        cursorRef.current = result.nextCursor;
        setHasMore(result.nextCursor !== null);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError("検索に失敗しました");
        if (!isMore) {
          setItems([]);
          setHasMore(false);
        }
      } finally {
        abortRef.current = null;
        if (isMore) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [fetcher],
  );

  const search = useCallback(
    (query: string) => {
      // 前のdebounceをクリア
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = undefined;
      }
      // 前のリクエストをキャンセル
      abortRef.current?.abort();
      abortRef.current = null;

      queryRef.current = query;

      if (!query.trim() || query.trim().length < minQueryLength) {
        setItems([]);
        setIsLoading(false);
        setHasMore(false);
        cursorRef.current = null;
        return;
      }

      debounceRef.current = setTimeout(() => {
        cursorRef.current = null;
        fetchPage(query.trim(), null, false);
      }, debounceMs);
    },
    [fetchPage, debounceMs, minQueryLength],
  );

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || !cursorRef.current) return;
    fetchPage(queryRef.current.trim(), cursorRef.current, true);
  }, [isLoadingMore, hasMore, fetchPage]);

  const reset = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    abortRef.current = null;
    setItems([]);
    setIsLoading(false);
    setIsLoadingMore(false);
    setHasMore(false);
    setError(null);
    cursorRef.current = null;
    queryRef.current = "";
  }, []);

  return {
    search,
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    reset,
  };
}
