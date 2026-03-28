"use client";

import { type MouseEvent, useCallback, useEffect, useState } from "react";

import { useToast } from "@/components/toast-provider";
import { buildSessionExpiredToast } from "@/lib/session-expired-toast";

interface BookmarkButtonProps {
  rankingId: string;
  initialIsBookmarked: boolean;
  bookmarkCount: number;
  className?: string;
  compact?: boolean;
  onChange?: (nextIsBookmarked: boolean, nextCount: number) => void;
}

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

export function BookmarkButton({
  rankingId,
  initialIsBookmarked,
  bookmarkCount,
  className,
  compact = false,
  onChange,
}: BookmarkButtonProps) {
  const { pushToast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [count, setCount] = useState(bookmarkCount);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setIsBookmarked(initialIsBookmarked);
  }, [initialIsBookmarked]);

  useEffect(() => {
    setCount(bookmarkCount);
  }, [bookmarkCount]);

  const handleToggle = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (isPending) {
        return;
      }

      const previousIsBookmarked = isBookmarked;
      const previousCount = count;
      const nextIsBookmarked = !isBookmarked;
      const nextCount = nextIsBookmarked ? count + 1 : Math.max(0, count - 1);

      setIsBookmarked(nextIsBookmarked);
      setCount(nextCount);
      setIsPending(true);

      try {
        const response = await fetch(`/api/v1/bookmarks/${rankingId}`, {
          method: nextIsBookmarked ? "POST" : "DELETE",
        });

        if (!response.ok) {
          setIsBookmarked(previousIsBookmarked);
          setCount(previousCount);

          if (response.status === 401) {
            pushToast(buildSessionExpiredToast());
          } else {
            pushToast({
              type: "error",
              message: nextIsBookmarked
                ? "ブックマークに失敗しました。"
                : "ブックマーク解除に失敗しました。",
            });
          }
          return;
        }

        onChange?.(nextIsBookmarked, nextCount);
      } catch {
        setIsBookmarked(previousIsBookmarked);
        setCount(previousCount);
        pushToast({
          type: "error",
          message: nextIsBookmarked
            ? "ブックマークに失敗しました。"
            : "ブックマーク解除に失敗しました。",
        });
      } finally {
        setIsPending(false);
      }
    },
    [count, isBookmarked, isPending, onChange, pushToast, rankingId],
  );

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      data-page-transition-ignore
      className={`inline-flex items-center gap-1 text-xs transition disabled:opacity-60 ${compact ? "" : "rounded-md bg-transparent px-1.5 py-1 hover:bg-muted"} ${className ?? ""}`}
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
