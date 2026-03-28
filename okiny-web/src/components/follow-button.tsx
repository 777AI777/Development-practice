"use client";

import { type MouseEvent, useCallback, useEffect, useState } from "react";

import { useToast } from "@/components/toast-provider";
import { invalidateMyProfileStats } from "@/hooks/use-my-profile-stats";
import { clearListCache } from "@/lib/list-cache";
import { buildSessionExpiredToast } from "@/lib/session-expired-toast";

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  className?: string;
  onChange?: (nextIsFollowing: boolean) => void;
}

export function FollowButton({
  userId,
  initialIsFollowing,
  className,
  onChange,
}: FollowButtonProps) {
  const { pushToast } = useToast();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const handleToggle = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (isPending) {
        return;
      }

      const previousIsFollowing = isFollowing;
      const nextIsFollowing = !isFollowing;

      setIsFollowing(nextIsFollowing);
      setIsPending(true);

      try {
        const response = await fetch(`/api/v1/users/${userId}/follow`, {
          method: nextIsFollowing ? "POST" : "DELETE",
        });

        if (!response.ok) {
          setIsFollowing(previousIsFollowing);

          if (response.status === 401) {
            pushToast(buildSessionExpiredToast());
          } else {
            pushToast({
              type: "error",
              message: nextIsFollowing
                ? "フォローに失敗しました。"
                : "フォロー解除に失敗しました。",
            });
          }
          return;
        }

        invalidateMyProfileStats();
        clearListCache({ cacheKey: "okiny:following-feed-cache" });
        onChange?.(nextIsFollowing);
      } catch {
        setIsFollowing(previousIsFollowing);
        pushToast({
          type: "error",
          message: nextIsFollowing
            ? "フォローに失敗しました。"
            : "フォロー解除に失敗しました。",
        });
      } finally {
        setIsPending(false);
      }
    },
    [isFollowing, isPending, onChange, pushToast, userId],
  );

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      data-page-transition-ignore
      className={`inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition disabled:opacity-60 ${
        isFollowing
          ? "border border-border bg-card text-foreground hover:bg-muted"
          : "bg-primary text-primary-foreground hover:opacity-90"
      } ${className ?? ""}`}
      aria-label={isFollowing ? "フォロー解除" : "フォロー"}
      aria-pressed={isFollowing}
    >
      {isFollowing ? "フォロー中" : "フォローする"}
    </button>
  );
}
