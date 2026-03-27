"use client";

import { useCallback, useState } from "react";

interface BookmarkButtonProps {
  rankingId: string;
  initialIsBookmarked: boolean;
  bookmarkCount: number;
}

/** ブックマーク済みアイコン（塗りつぶし） */
function BookmarkFilledIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

/** 未ブックマークアイコン（アウトライン） */
function BookmarkOutlineIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

/**
 * ブックマークトグルボタン。
 * 楽観的UI更新を行い、API呼び出しに失敗した場合はリバートする。
 */
export function BookmarkButton({
  rankingId,
  initialIsBookmarked,
  bookmarkCount,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [count, setCount] = useState(bookmarkCount);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = useCallback(async () => {
    if (isPending) return;

    // 楽観的UI更新
    const prevBookmarked = isBookmarked;
    const prevCount = count;
    const nextBookmarked = !isBookmarked;
    const nextCount = nextBookmarked ? count + 1 : Math.max(0, count - 1);

    setIsBookmarked(nextBookmarked);
    setCount(nextCount);
    setIsPending(true);

    try {
      const method = nextBookmarked ? "POST" : "DELETE";
      const response = await fetch(`/api/v1/bookmarks/${rankingId}`, {
        method,
      });

      if (!response.ok) {
        // API失敗時はリバート
        setIsBookmarked(prevBookmarked);
        setCount(prevCount);
      }
    } catch {
      // ネットワークエラー時もリバート
      setIsBookmarked(prevBookmarked);
      setCount(prevCount);
    } finally {
      setIsPending(false);
    }
  }, [isPending, isBookmarked, count, rankingId]);

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className="inline-flex items-center gap-1 rounded-md bg-transparent px-1.5 py-1 text-xs transition hover:bg-muted disabled:opacity-60"
      style={{
        color: isBookmarked ? "var(--primary)" : "var(--muted-foreground)",
      }}
      aria-label={isBookmarked ? "ブックマーク解除" : "ブックマーク"}
      aria-pressed={isBookmarked}
    >
      {isBookmarked ? <BookmarkFilledIcon /> : <BookmarkOutlineIcon />}
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
