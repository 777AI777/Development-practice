"use client";

import type { ReactNode } from "react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";

interface PullToRefreshProps {
  /** リフレッシュ時に呼ばれる非同期関数 */
  onRefresh: () => Promise<void>;
  /** pull-to-refreshを有効にするか（デフォルト: true） */
  isEnabled?: boolean;
  /** 子要素 */
  children: ReactNode;
}

const PULL_THRESHOLD = 80;

/**
 * モバイル向けpull-to-refreshラッパーコンポーネント。
 * スクロール最上部から下にスワイプするとリフレッシュをトリガーする。
 */
export function PullToRefresh({
  onRefresh,
  isEnabled = true,
  children,
}: PullToRefreshProps) {
  const { containerRef, pullDistance, isRefreshing, isPulling } =
    usePullToRefresh({
      onRefresh,
      isEnabled,
      threshold: PULL_THRESHOLD,
    });

  const isPastThreshold = pullDistance >= PULL_THRESHOLD;
  const showIndicator = isPulling || isRefreshing;
  // インジケーターの不透明度（プル距離に比例）
  const indicatorOpacity = isRefreshing
    ? 1
    : Math.min(1, pullDistance / PULL_THRESHOLD);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ overscrollBehavior: "contain" }}
    >
      {/* プルインジケーター */}
      {showIndicator && (
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{ height: `${pullDistance}px` }}
          aria-live="polite"
        >
          <div
            className="flex flex-col items-center gap-1"
            style={{ opacity: indicatorOpacity }}
          >
            {isRefreshing ? (
              <RefreshSpinner />
            ) : (
              <PullArrow isPastThreshold={isPastThreshold} />
            )}
            <span className="text-xs text-muted-foreground">
              {isRefreshing
                ? "更新中..."
                : isPastThreshold
                  ? "離して更新"
                  : "引っ張って更新"}
            </span>
          </div>
        </div>
      )}

      {/* コンテンツ */}
      <div
        className={isPulling || isRefreshing ? "" : "transition-transform duration-200 ease-out"}
      >
        {children}
      </div>
    </div>
  );
}

/** プル方向を示す矢印アイコン */
function PullArrow({ isPastThreshold }: { isPastThreshold: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-muted-foreground transition-transform duration-200 ${
        isPastThreshold ? "rotate-180" : ""
      }`}
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}

/** リフレッシュ中のスピナー */
function RefreshSpinner() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin text-primary"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
