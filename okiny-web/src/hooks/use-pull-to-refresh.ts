"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UsePullToRefreshOptions {
  /** リフレッシュ時に呼ばれる非同期関数 */
  onRefresh: () => Promise<void>;
  /** pull-to-refreshを有効にするか（デフォルト: true） */
  isEnabled?: boolean;
  /** トリガーに必要なプル距離（px）（デフォルト: 80） */
  threshold?: number;
  /** 最大プル距離（px）（デフォルト: 120） */
  maxPull?: number;
}

interface UsePullToRefreshReturn {
  /** スクロール可能なコンテナに付与するref */
  containerRef: React.RefCallback<HTMLElement>;
  /** 現在のプル距離（px） */
  pullDistance: number;
  /** リフレッシュ中かどうか */
  isRefreshing: boolean;
  /** ユーザーがプル操作中かどうか */
  isPulling: boolean;
}

/**
 * モバイル向けpull-to-refreshフック。
 * touchイベントを監視し、スクロール最上部からの下方向スワイプでリフレッシュをトリガーする。
 */
export function usePullToRefresh({
  onRefresh,
  isEnabled = true,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [containerEl, setContainerEl] = useState<HTMLElement | null>(null);

  const containerElRef = useRef<HTMLElement | null>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const isPullingRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  // 最新のonRefreshをrefに同期
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!isEnabled || isRefreshingRef.current) return;

      const container = containerElRef.current;
      if (!container) return;

      // スクロール最上部でない場合は無視
      if (window.scrollY > 0) return;

      const touch = e.touches[0];
      if (!touch) return;

      startYRef.current = touch.clientY;
      currentYRef.current = touch.clientY;
    },
    [isEnabled],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isEnabled || isRefreshingRef.current) return;

      const container = containerElRef.current;
      if (!container) return;

      const touch = e.touches[0];
      if (!touch) return;

      currentYRef.current = touch.clientY;
      const deltaY = currentYRef.current - startYRef.current;

      // 上方向のスワイプ、またはスクロール位置が0でない場合は無視
      if (deltaY <= 0 || window.scrollY > 0) {
        if (isPullingRef.current) {
          isPullingRef.current = false;
          setIsPulling(false);
          setPullDistance(0);
        }
        return;
      }

      // ブラウザのネイティブスクロール・pull-to-refreshを抑止
      e.preventDefault();

      if (!isPullingRef.current) {
        isPullingRef.current = true;
        setIsPulling(true);
      }

      // 減衰付きのプル距離計算（引っ張るほど重くなる）
      const dampedDistance = Math.min(
        maxPull,
        deltaY * (1 - deltaY / (maxPull * 4)),
      );
      setPullDistance(Math.max(0, dampedDistance));
    },
    [isEnabled, maxPull],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;

    isPullingRef.current = false;
    setIsPulling(false);

    const currentPull = currentYRef.current - startYRef.current;
    const dampedDistance = Math.min(
      maxPull,
      currentPull * (1 - currentPull / (maxPull * 4)),
    );

    if (dampedDistance >= threshold && !isRefreshingRef.current) {
      // しきい値を超えた → リフレッシュ実行
      isRefreshingRef.current = true;
      setIsRefreshing(true);
      setPullDistance(threshold); // リフレッシュ中はしきい値位置で固定

      try {
        await onRefreshRef.current();
      } finally {
        isRefreshingRef.current = false;
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // しきい値未満 → 元に戻す
      setPullDistance(0);
    }

    startYRef.current = 0;
    currentYRef.current = 0;
  }, [maxPull, threshold]);

  // containerEl stateベースでリスナー管理（ref callbackとの二重登録を防止）
  useEffect(() => {
    if (!containerEl || !isEnabled) return;

    containerEl.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    containerEl.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    containerEl.addEventListener("touchend", handleTouchEnd, {
      passive: true,
    });

    return () => {
      containerEl.removeEventListener("touchstart", handleTouchStart);
      containerEl.removeEventListener("touchmove", handleTouchMove);
      containerEl.removeEventListener("touchend", handleTouchEnd);
    };
  }, [containerEl, isEnabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const containerRef: React.RefCallback<HTMLElement> = useCallback(
    (node: HTMLElement | null) => {
      containerElRef.current = node;
      setContainerEl(node);
    },
    [],
  );

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    isPulling,
  };
}
