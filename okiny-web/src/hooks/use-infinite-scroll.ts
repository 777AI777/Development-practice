"use client";

import { useCallback, useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
  /** ビューポートに入った時に呼ばれるコールバック */
  onLoadMore: () => void;
  /** 追加読み込み中フラグ（trueの間はトリガーしない） */
  isLoading: boolean;
  /** まだデータがあるかフラグ（falseならobserverを停止） */
  hasMore: boolean;
  /** ビューポートとの距離マージン（デフォルト: "200px"）*/
  rootMargin?: string;
}

/**
 * IntersectionObserverを使った無限スクロールHook。
 * 返り値のrefをsentinel要素に渡す。
 */
export function useInfiniteScroll({
  onLoadMore,
  isLoading,
  hasMore,
  rootMargin = "200px",
}: UseInfiniteScrollOptions): React.RefCallback<HTMLDivElement> {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const callbackRef = useRef(onLoadMore);
  const isLoadingRef = useRef(isLoading);
  const hasMoreRef = useRef(hasMore);

  // 最新の値をrefに同期（observer callbackで最新値を参照するため）
  useEffect(() => {
    callbackRef.current = onLoadMore;
  }, [onLoadMore]);
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  // cleanup
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const sentinelRef: React.RefCallback<HTMLDivElement> = useCallback(
    (node: HTMLDivElement | null) => {
      // 前のobserverをクリーンアップ
      observerRef.current?.disconnect();

      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (
            entry?.isIntersecting &&
            !isLoadingRef.current &&
            hasMoreRef.current
          ) {
            callbackRef.current();
          }
        },
        { rootMargin },
      );

      observerRef.current.observe(node);
    },
    [rootMargin],
  );

  return sentinelRef;
}
