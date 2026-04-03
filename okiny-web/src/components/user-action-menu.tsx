"use client";

import { type MouseEvent, useCallback, useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast-provider";
import { RECOMMEND_FEED_CACHE_KEY } from "@/lib/constants";
import { clearListCache } from "@/lib/list-cache";
import { buildSessionExpiredToast } from "@/lib/session-expired-toast";

interface UserActionMenuProps {
  userId: string;
  displayName: string;
  initialRelationship: {
    isMuted: boolean;
    isBlocked: boolean;
  };
  onMuteChange?: (isMuted: boolean) => void;
  onBlockChange?: (isBlocked: boolean) => void;
}

export function UserActionMenu({
  userId,
  displayName,
  initialRelationship,
  onMuteChange,
  onBlockChange,
}: UserActionMenuProps) {
  const { pushToast } = useToast();
  const [isMuted, setIsMuted] = useState(initialRelationship.isMuted);
  const [isBlocked, setIsBlocked] = useState(initialRelationship.isBlocked);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  useEffect(() => {
    setIsMuted(initialRelationship.isMuted);
  }, [initialRelationship.isMuted]);

  useEffect(() => {
    setIsBlocked(initialRelationship.isBlocked);
  }, [initialRelationship.isBlocked]);

  const handleToggleMenu = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setMenuOpen((prev) => !prev);
    },
    [],
  );

  const invalidateFeedCaches = useCallback(() => {
    clearListCache({ cacheKey: RECOMMEND_FEED_CACHE_KEY });
    clearListCache({ cacheKey: "okiny:following-feed-cache" });
  }, []);

  const handleMuteToggle = useCallback(async () => {
    if (isPending) return;

    const previousIsMuted = isMuted;
    const nextIsMuted = !isMuted;

    setIsMuted(nextIsMuted);
    setMenuOpen(false);
    setIsPending(true);

    try {
      const response = await fetch(`/api/v1/users/${userId}/mute`, {
        method: nextIsMuted ? "POST" : "DELETE",
      });

      if (!response.ok) {
        setIsMuted(previousIsMuted);

        if (response.status === 401) {
          pushToast(buildSessionExpiredToast());
        } else {
          pushToast({
            type: "error",
            message: nextIsMuted
              ? "ミュートに失敗しました。"
              : "ミュート解除に失敗しました。",
          });
        }
        return;
      }

      invalidateFeedCaches();
      pushToast({
        type: "success",
        message: nextIsMuted
          ? `${displayName}さんをミュートしました`
          : `${displayName}さんのミュートを解除しました`,
      });
      onMuteChange?.(nextIsMuted);
    } catch {
      setIsMuted(previousIsMuted);
      pushToast({
        type: "error",
        message: nextIsMuted
          ? "ミュートに失敗しました。"
          : "ミュート解除に失敗しました。",
      });
    } finally {
      setIsPending(false);
    }
  }, [
    displayName,
    invalidateFeedCaches,
    isMuted,
    isPending,
    onMuteChange,
    pushToast,
    userId,
  ]);

  const executeBlock = useCallback(
    async (nextIsBlocked: boolean) => {
      const previousIsBlocked = !nextIsBlocked;

      setIsBlocked(nextIsBlocked);
      setMenuOpen(false);
      setIsPending(true);

      try {
        const response = await fetch(`/api/v1/users/${userId}/block`, {
          method: nextIsBlocked ? "POST" : "DELETE",
        });

        if (!response.ok) {
          setIsBlocked(previousIsBlocked);

          if (response.status === 401) {
            pushToast(buildSessionExpiredToast());
          } else {
            pushToast({
              type: "error",
              message: nextIsBlocked
                ? "ブロックに失敗しました。"
                : "ブロック解除に失敗しました。",
            });
          }
          return;
        }

        invalidateFeedCaches();
        pushToast({
          type: "success",
          message: nextIsBlocked
            ? `${displayName}さんをブロックしました`
            : `${displayName}さんのブロックを解除しました`,
        });
        onBlockChange?.(nextIsBlocked);
      } catch {
        setIsBlocked(previousIsBlocked);
        pushToast({
          type: "error",
          message: nextIsBlocked
            ? "ブロックに失敗しました。"
            : "ブロック解除に失敗しました。",
        });
      } finally {
        setIsPending(false);
      }
    },
    [displayName, invalidateFeedCaches, onBlockChange, pushToast, userId],
  );

  const handleBlockToggle = useCallback(() => {
    if (isPending) return;

    const nextIsBlocked = !isBlocked;

    if (nextIsBlocked) {
      setMenuOpen(false);
      setBlockDialogOpen(true);
    } else {
      executeBlock(nextIsBlocked);
    }
  }, [executeBlock, isBlocked, isPending]);

  const handleBlockConfirm = useCallback(() => {
    setBlockDialogOpen(false);
    executeBlock(true);
  }, [executeBlock]);

  const handleBlockCancel = useCallback(() => {
    setBlockDialogOpen(false);
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggleMenu}
        disabled={isPending}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-foreground transition hover:bg-muted disabled:opacity-60"
        aria-label="ユーザーメニュー"
      >
        <span className="text-base font-black leading-none">{"\u22EF"}</span>
      </button>
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-border bg-card py-1 shadow-md">
            <button
              type="button"
              onClick={handleMuteToggle}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition hover:bg-muted"
            >
              {isMuted ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                  ミュートを解除
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                  {displayName}さんをミュート
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleBlockToggle}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-destructive transition hover:bg-muted"
            >
              {isBlocked ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                  ブロックを解除
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                  {displayName}さんをブロック
                </>
              )}
            </button>
          </div>
        </>
      )}
      <ConfirmDialog
        open={blockDialogOpen}
        onConfirm={handleBlockConfirm}
        onCancel={handleBlockCancel}
        title={`${displayName}さんをブロックしますか？`}
        message="ブロックすると相互にコンテンツが見えなくなります。"
        confirmLabel="ブロック"
        cancelLabel="キャンセル"
        variant="destructive"
      />
    </div>
  );
}
