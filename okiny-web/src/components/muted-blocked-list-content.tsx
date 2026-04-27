"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type MouseEvent,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/back-button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { usePageTransition } from "@/components/page-transition-provider";
import { useToast } from "@/components/toast-provider";
import { SCROLL_KEY_MUTED_BLOCKED } from "@/lib/constants";
import { buildSessionExpiredToast } from "@/lib/session-expired-toast";
import type { MutedWord, UserProfile } from "@/lib/types";
import { buildUserProfilePath, getUserInitial } from "@/lib/user-utils";

type TabType = "muted" | "blocked" | "words";

interface MutedBlockedListContentProps {
  mutedUsers: readonly UserProfile[];
  blockedUsers: readonly UserProfile[];
  mutedWords: readonly MutedWord[];
  initialTab: TabType;
}

function UserAvatar({ user }: { user: UserProfile }) {
  return user.avatarUrl ? (
    <Image
      src={user.avatarUrl}
      alt={user.displayName}
      width={44}
      height={44}
      className="h-11 w-11 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
      {getUserInitial(user.displayName, "?")}
    </div>
  );
}

function UserInfo({ user }: { user: UserProfile }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-foreground">
        {user.displayName}
      </p>
      {user.displayUserId ? (
        <p className="truncate text-xs text-muted-foreground">
          @{user.displayUserId}
        </p>
      ) : null}
    </div>
  );
}

function EmptyState({ tab }: { tab: TabType }) {
  const message =
    tab === "muted"
      ? "ミュートしたユーザーはいません"
      : tab === "blocked"
        ? "ブロックしたユーザーはいません"
        : "ミュートワードはありません";

  return (
    <div className="px-4 py-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function UserListItem({
  user,
  profilePath,
  actionButton,
}: {
  user: UserProfile;
  profilePath: string;
  actionButton: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 transition hover:bg-muted/50">
      <Link href={profilePath} className="flex shrink-0 items-center">
        <UserAvatar user={user} />
      </Link>

      <Link href={profilePath} className="min-w-0 flex-1">
        <UserInfo user={user} />
      </Link>

      <div className="flex shrink-0 items-center">{actionButton}</div>
    </div>
  );
}

function MutedWordInput({ onAdd }: { onAdd: (word: string) => void }) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = inputValue.trim();
  const isValid = trimmed.length >= 1 && trimmed.length <= 50;

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!isValid) return;
      onAdd(trimmed);
      setInputValue("");
      inputRef.current?.focus();
    },
    [isValid, onAdd, trimmed],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-b border-border px-4 py-3"
    >
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="ミュートするワードを入力"
        maxLength={50}
        className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        disabled={!isValid}
        className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        追加
      </button>
    </form>
  );
}

function MutedWordItem({
  word,
  onRemove,
  isPending,
}: {
  word: MutedWord;
  onRemove: (wordId: string) => void;
  isPending: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
        {word.word}
      </span>
      <button
        type="button"
        onClick={() => onRemove(word.id)}
        disabled={isPending}
        className="ml-3 shrink-0 text-muted-foreground transition hover:text-foreground disabled:opacity-50"
        aria-label={`${word.word}を削除`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

function MutedBlockedListContentInner({
  mutedUsers: initialMutedUsers,
  blockedUsers: initialBlockedUsers,
  mutedWords: initialMutedWords,
  initialTab,
}: MutedBlockedListContentProps) {
  const router = useRouter();
  const { signalReady } = usePageTransition();
  const { pushToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [localMutedUsers, setLocalMutedUsers] =
    useState<readonly UserProfile[]>(initialMutedUsers);
  const [localBlockedUsers, setLocalBlockedUsers] =
    useState<readonly UserProfile[]>(initialBlockedUsers);
  const [localMutedWords, setLocalMutedWords] =
    useState<readonly MutedWord[]>(initialMutedWords);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [unblockTarget, setUnblockTarget] = useState<UserProfile | null>(null);

  useEffect(() => {
    signalReady();
  }, [signalReady]);

  // マウント時: スクロール位置を復元
  useEffect(() => {
    const savedY = sessionStorage.getItem(SCROLL_KEY_MUTED_BLOCKED);
    if (savedY) {
      sessionStorage.removeItem(SCROLL_KEY_MUTED_BLOCKED);
      requestAnimationFrame(() => {
        window.scrollTo(0, Number(savedY));
      });
    }
  }, []);

  // アンマウント時: スクロール位置を保存
  useEffect(() => {
    return () => {
      sessionStorage.setItem(
        SCROLL_KEY_MUTED_BLOCKED,
        String(window.scrollY),
      );
    };
  }, []);

  const handleTabChange = useCallback(
    (tab: TabType) => {
      setActiveTab(tab);

      const pathMap: Record<TabType, string> = {
        muted: "/settings/muted-users",
        blocked: "/settings/blocked-users",
        words: "/settings/muted-words",
      };
      router.replace(pathMap[tab], { scroll: false });
    },
    [router],
  );

  const handleUnmute = useCallback(
    async (targetUserId: string) => {
      if (pendingIds.has(targetUserId)) return;

      // 楽観的UI: リストから即座に削除
      const previousUsers = localMutedUsers;
      setLocalMutedUsers((prev) =>
        prev.filter((u) => u.id !== targetUserId),
      );
      setPendingIds((prev) => new Set([...prev, targetUserId]));

      try {
        const response = await fetch(`/api/v1/users/${targetUserId}/mute`, {
          method: "DELETE",
        });

        if (!response.ok) {
          setLocalMutedUsers(previousUsers);

          if (response.status === 401) {
            pushToast(buildSessionExpiredToast());
          } else {
            pushToast({
              type: "error",
              message: "ミュート解除に失敗しました。",
            });
          }
          return;
        }

        pushToast({
          type: "success",
          message: "ミュートを解除しました。",
        });
      } catch {
        setLocalMutedUsers(previousUsers);
        pushToast({
          type: "error",
          message: "ミュート解除に失敗しました。",
        });
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(targetUserId);
          return next;
        });
      }
    },
    [localMutedUsers, pendingIds, pushToast],
  );

  const handleUnblockClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>, user: UserProfile) => {
      event.preventDefault();
      event.stopPropagation();
      if (pendingIds.has(user.id)) return;
      setUnblockTarget(user);
    },
    [pendingIds],
  );

  const handleUnblockConfirm = useCallback(async () => {
    if (!unblockTarget) return;

    const targetUser = unblockTarget;
    setUnblockTarget(null);

    // 楽観的UI: リストから即座に削除
    const previousUsers = localBlockedUsers;
    setLocalBlockedUsers((prev) =>
      prev.filter((u) => u.id !== targetUser.id),
    );
    setPendingIds((prev) => new Set([...prev, targetUser.id]));

    try {
      const response = await fetch(`/api/v1/users/${targetUser.id}/block`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setLocalBlockedUsers(previousUsers);

        if (response.status === 401) {
          pushToast(buildSessionExpiredToast());
        } else {
          pushToast({
            type: "error",
            message: "ブロック解除に失敗しました。",
          });
        }
        return;
      }

      pushToast({
        type: "success",
        message: "ブロックを解除しました。",
      });
    } catch {
      setLocalBlockedUsers(previousUsers);
      pushToast({
        type: "error",
        message: "ブロック解除に失敗しました。",
      });
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUser.id);
        return next;
      });
    }
  }, [localBlockedUsers, pushToast, unblockTarget]);

  const handleAddMutedWord = useCallback(
    async (word: string) => {
      // 重複チェック（ローカル）
      if (localMutedWords.some((w) => w.word === word)) {
        pushToast({
          type: "warning",
          message: "そのワードは既に登録されています。",
        });
        return;
      }

      // 楽観的UI: 仮IDで即座にリストに追加
      const tempId = `temp-${Date.now()}`;
      const optimisticWord: MutedWord = {
        id: tempId,
        word,
        createdAt: new Date().toISOString(),
      };
      const previousWords = localMutedWords;
      setLocalMutedWords((prev) => [optimisticWord, ...prev]);

      try {
        const response = await fetch("/api/v1/muted-words", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word }),
        });

        if (!response.ok) {
          setLocalMutedWords(previousWords);

          if (response.status === 401) {
            pushToast(buildSessionExpiredToast());
          } else {
            pushToast({
              type: "error",
              message: "ミュートワードの追加に失敗しました。",
            });
          }
          return;
        }

        // POST は 204 (No Content) を返すため、最新リストを再取得してtempIdを正式データに置換
        try {
          const listResponse = await fetch("/api/v1/muted-words");
          if (listResponse.ok) {
            const listData = (await listResponse.json()) as { data: MutedWord[] };
            setLocalMutedWords(listData.data);
          }
        } catch {
          // リスト再取得に失敗してもtempIdのまま表示を維持（次回ページ読み込みで正式化される）
        }

        pushToast({
          type: "success",
          message: "ミュートワードを追加しました。",
        });
      } catch {
        setLocalMutedWords(previousWords);
        pushToast({
          type: "error",
          message: "ミュートワードの追加に失敗しました。",
        });
      }
    },
    [localMutedWords, pushToast],
  );

  const handleRemoveMutedWord = useCallback(
    async (wordId: string) => {
      if (pendingIds.has(wordId)) return;

      // 楽観的UI: リストから即座に削除
      const previousWords = localMutedWords;
      setLocalMutedWords((prev) => prev.filter((w) => w.id !== wordId));
      setPendingIds((prev) => new Set([...prev, wordId]));

      try {
        const response = await fetch(`/api/v1/muted-words/${wordId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          setLocalMutedWords(previousWords);

          if (response.status === 401) {
            pushToast(buildSessionExpiredToast());
          } else {
            pushToast({
              type: "error",
              message: "ミュートワードの削除に失敗しました。",
            });
          }
          return;
        }

        pushToast({
          type: "success",
          message: "ミュートワードを削除しました。",
        });
      } catch {
        setLocalMutedWords(previousWords);
        pushToast({
          type: "error",
          message: "ミュートワードの削除に失敗しました。",
        });
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(wordId);
          return next;
        });
      }
    },
    [localMutedWords, pendingIds, pushToast],
  );

  const mutedCount = localMutedUsers.length;
  const blockedCount = localBlockedUsers.length;
  const wordsCount = localMutedWords.length;

  return (
    <AppShell>
      {/* ヘッダー: 戻るボタン + タイトル */}
      <div className="mb-4 flex items-center gap-2">
        <BackButton href="/settings" />
        <h1 className="text-lg font-bold text-foreground">設定</h1>
      </div>

      {/* タブバー */}
      <div className="flex border-b border-border" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "muted"}
          onClick={() => handleTabChange("muted")}
          className={`flex-1 py-3 text-center text-sm font-semibold transition ${
            activeTab === "muted"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {`ミュート中 ${mutedCount}`}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "blocked"}
          onClick={() => handleTabChange("blocked")}
          className={`flex-1 py-3 text-center text-sm font-semibold transition ${
            activeTab === "blocked"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {`ブロック中 ${blockedCount}`}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "words"}
          onClick={() => handleTabChange("words")}
          className={`flex-1 py-3 text-center text-sm font-semibold transition ${
            activeTab === "words"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {`ミュートワード ${wordsCount}`}
        </button>
      </div>

      {/* ミュートタブ */}
      {activeTab === "muted" && (
        <div role="tabpanel">
          {localMutedUsers.length === 0 ? (
            <EmptyState tab="muted" />
          ) : (
            <div>
              {localMutedUsers.map((user) => {
                const profilePath = buildUserProfilePath(user);

                return (
                  <UserListItem
                    key={user.id}
                    user={user}
                    profilePath={profilePath}
                    actionButton={
                      <button
                        type="button"
                        onClick={() => handleUnmute(user.id)}
                        disabled={pendingIds.has(user.id)}
                        className="shrink-0 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
                      >
                        解除
                      </button>
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ブロックタブ */}
      {activeTab === "blocked" && (
        <div role="tabpanel">
          {localBlockedUsers.length === 0 ? (
            <EmptyState tab="blocked" />
          ) : (
            <div>
              {localBlockedUsers.map((user) => {
                const profilePath = buildUserProfilePath(user);

                return (
                  <UserListItem
                    key={user.id}
                    user={user}
                    profilePath={profilePath}
                    actionButton={
                      <button
                        type="button"
                        onClick={(e) => handleUnblockClick(e, user)}
                        disabled={pendingIds.has(user.id)}
                        className="shrink-0 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
                      >
                        解除
                      </button>
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ミュートワードタブ */}
      {activeTab === "words" && (
        <div role="tabpanel">
          <MutedWordInput onAdd={handleAddMutedWord} />
          {localMutedWords.length === 0 ? (
            <EmptyState tab="words" />
          ) : (
            <div>
              {localMutedWords.map((word) => (
                <MutedWordItem
                  key={word.id}
                  word={word}
                  onRemove={handleRemoveMutedWord}
                  isPending={pendingIds.has(word.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ブロック解除確認ダイアログ */}
      <ConfirmDialog
        open={unblockTarget !== null}
        title="ブロックを解除しますか？"
        message={`${unblockTarget?.displayName ?? ""}のブロックを解除すると、相手があなたのプロフィールやランキングを閲覧できるようになります。`}
        confirmLabel="解除"
        cancelLabel="キャンセル"
        variant="destructive"
        onConfirm={handleUnblockConfirm}
        onCancel={() => setUnblockTarget(null)}
      />
    </AppShell>
  );
}

export function MutedBlockedListContent(props: MutedBlockedListContentProps) {
  return (
    <Suspense fallback={null}>
      <MutedBlockedListContentInner {...props} />
    </Suspense>
  );
}
