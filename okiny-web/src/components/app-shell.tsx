"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useToast } from "@/components/toast-provider";
import { useDisplayUserIdCheck } from "@/hooks/use-display-user-id-check";
import { useSessionUser } from "@/hooks/use-session-user";
import {
  DISPLAY_USER_ID_MAX_LENGTH,
  getUserInitial,
  normalizeDisplayUserId,
  parseDisplayUserIdSearchQuery,
} from "@/lib/user-utils";

const APP_BRAND = "OKINY";
const MAX_DISPLAY_NAME_LENGTH = 30;

interface AppShellProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

interface SidebarMenuItemConfig {
  label: string;
  href?: string;
  disabled: boolean;
  comingSoon?: boolean;
}

interface ShellUser {
  name?: string;
  email?: string;
  avatarUrl?: string;
  displayUserId?: string | null;
}

const SETTINGS_MENU_ITEMS: SidebarMenuItemConfig[] = [
  { label: "通知設定", disabled: true, comingSoon: true },
  { label: "テーマ設定", disabled: true, comingSoon: true },
  { label: "利用規約", href: "/terms", disabled: false },
  { label: "プライバシーポリシー", href: "/privacy", disabled: false },
];

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function DisplayNameEditor({
  user,
  updateDisplayName,
  onDone,
}: {
  user: ShellUser | null;
  updateDisplayName: (name: string) => Promise<"success" | "invalid" | "server">;
  onDone: () => void;
}) {
  const { pushToast } = useToast();
  const [displayName, setDisplayName] = useState(user?.name ?? "");

  const isDirty = useMemo(
    () => displayName.trim() !== (user?.name ?? ""),
    [displayName, user?.name],
  );
  const canSave = displayName.trim().length > 0 && isDirty;

  const save = async () => {
    if (!canSave) return;

    const status = await updateDisplayName(displayName.trim());
    if (status === "success") {
      pushToast({ type: "success", message: "表示名を更新しました。" });
      onDone();
      return;
    }

    pushToast({
      type: "error",
      message:
        status === "invalid"
          ? "表示名は1〜30文字で入力してください。"
          : "表示名の更新に失敗しました。",
    });
  };

  return (
    <div className="border-t border-border px-4 py-3">
      <label
        htmlFor="sidebar-display-name"
        className="mb-1 block text-xs font-semibold text-foreground"
      >
        表示名
      </label>
      <input
        id="sidebar-display-name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        maxLength={MAX_DISPLAY_NAME_LENGTH}
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="表示名を入力"
      />
      <p className="mt-1 text-right text-xs text-muted-foreground">
        {displayName.length}/{MAX_DISPLAY_NAME_LENGTH}
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-60"
        >
          保存
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-foreground"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

function DisplayUserIdEditor({
  user,
  updateDisplayUserId,
  onDone,
}: {
  user: ShellUser | null;
  updateDisplayUserId: (
    value: string,
  ) => Promise<"success" | "invalid" | "conflict" | "server">;
  onDone: () => void;
}) {
  const { pushToast } = useToast();
  const [displayUserId, setDisplayUserId] = useState(user?.displayUserId ?? "");

  const normalizedDisplayUserId = normalizeDisplayUserId(displayUserId);
  const isDirty = normalizedDisplayUserId !== (user?.displayUserId ?? "");

  // 自分自身の現在のIDと同じ場合はAPIチェックを抑止（空文字を渡して idle にする）
  const checkValue = isDirty ? normalizedDisplayUserId : "";
  const { status: availabilityStatus } = useDisplayUserIdCheck(checkValue);

  const canSave =
    normalizedDisplayUserId.length > 0 &&
    isDirty &&
    availabilityStatus === "available";

  const save = async () => {
    if (!canSave) return;

    const status = await updateDisplayUserId(normalizedDisplayUserId);
    if (status === "success") {
      pushToast({ type: "success", message: "ユーザーIDを更新しました。" });
      onDone();
      return;
    }

    if (status === "conflict") {
      pushToast({
        type: "error",
        message: "そのユーザーIDはすでに使われています。",
      });
      return;
    }

    pushToast({
      type: "error",
      message:
        status === "invalid"
          ? "ユーザーIDは3〜20文字の英小文字・数字・_で入力してください。"
          : "ユーザーIDの更新に失敗しました。",
    });
  };

  return (
    <div className="border-t border-border px-4 py-3">
      <label
        htmlFor="sidebar-display-user-id"
        className="mb-1 block text-xs font-semibold text-foreground"
      >
        ユーザーID
      </label>
      <div className="flex items-center rounded-md border border-border bg-background px-2">
        <span className="text-sm text-muted-foreground">@</span>
        <input
          id="sidebar-display-user-id"
          value={displayUserId}
          onChange={(e) => setDisplayUserId(e.target.value)}
          maxLength={DISPLAY_USER_ID_MAX_LENGTH}
          className="w-full bg-transparent px-1 py-1.5 text-sm text-foreground focus:outline-none"
          placeholder="okiny_user"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        英小文字・数字・_ を 3〜20文字で設定できます
      </p>
      <div className="mt-1 flex items-center justify-between">
        <div>
          {availabilityStatus === "checking" && (
            <span className="text-xs text-muted-foreground">確認中...</span>
          )}
          {availabilityStatus === "available" && (
            <span className="text-xs text-green-600">✓ 利用可能</span>
          )}
          {availabilityStatus === "taken" && (
            <span className="text-xs text-destructive">
              ✗ このIDは既に使われています
            </span>
          )}
          {availabilityStatus === "error" && (
            <span className="text-xs text-destructive">確認に失敗しました</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {normalizedDisplayUserId.length}/{DISPLAY_USER_ID_MAX_LENGTH}
        </span>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-60"
        >
          保存
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-foreground"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

function SettingsAccordion({
  settingsExpanded,
  onToggle,
  nameEditOpen,
  onNameEditToggle,
  userIdEditOpen,
  onUserIdEditToggle,
  user,
  updateDisplayName,
  updateDisplayUserId,
  onNavigate,
}: {
  settingsExpanded: boolean;
  onToggle: () => void;
  nameEditOpen: boolean;
  onNameEditToggle: () => void;
  userIdEditOpen: boolean;
  onUserIdEditToggle: () => void;
  user: ShellUser | null;
  updateDisplayName: (name: string) => Promise<"success" | "invalid" | "server">;
  updateDisplayUserId: (
    value: string,
  ) => Promise<"success" | "invalid" | "conflict" | "server">;
  onNavigate?: () => void;
}) {
  return (
    <>
      <Link
        href="/bookmarks"
        onClick={onNavigate}
        className="flex w-full items-center gap-3 bg-transparent px-4 py-3 text-left text-foreground transition hover:bg-muted"
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
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
        <span className="text-sm font-medium">ブックマーク</span>
      </Link>

      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 bg-transparent px-4 py-3 text-left text-foreground transition hover:bg-muted"
      >
        <span className="text-lg">{"\u2699"}</span>
        <span className="flex-1 text-sm font-medium">設定</span>
        <span
          className={`text-xs font-bold text-muted-foreground transition-transform ${settingsExpanded ? "rotate-0" : "-rotate-90"}`}
        >
          {"\u25BC"}
        </span>
      </button>

      {settingsExpanded && (
        <div className="pl-10">
          <button
            type="button"
            onClick={onNameEditToggle}
            className="w-full cursor-pointer bg-transparent px-4 py-2 text-left text-sm text-foreground transition hover:bg-muted"
          >
            表示名を編集
          </button>

          {nameEditOpen && (
            <DisplayNameEditor
              user={user}
              updateDisplayName={updateDisplayName}
              onDone={onNameEditToggle}
            />
          )}

          <button
            type="button"
            onClick={onUserIdEditToggle}
            className="w-full cursor-pointer bg-transparent px-4 py-2 text-left text-sm text-foreground transition hover:bg-muted"
          >
            ユーザーIDを編集
          </button>

          {userIdEditOpen && (
            <DisplayUserIdEditor
              user={user}
              updateDisplayUserId={updateDisplayUserId}
              onDone={onUserIdEditToggle}
            />
          )}

          {SETTINGS_MENU_ITEMS.map((item) =>
            item.href && !item.disabled ? (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                className="block w-full cursor-pointer bg-transparent px-4 py-2 text-left text-sm text-foreground transition hover:bg-muted"
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                disabled={item.disabled}
                className={`w-full bg-transparent px-4 py-2 text-left text-sm transition ${
                  item.disabled
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:bg-muted"
                }`}
                style={{
                  color: item.disabled
                    ? "var(--muted-foreground)"
                    : "var(--foreground)",
                }}
              >
                <span className="flex items-center gap-2">
                  {item.label}
                  {item.comingSoon && (
                    <span className="text-xs text-muted-foreground">
                      (Coming Soon)
                    </span>
                  )}
                </span>
              </button>
            ),
          )}
        </div>
      )}

      <Link
        href="/settings/logout"
        onClick={onNavigate}
        className="flex w-full items-center gap-3 bg-transparent px-4 py-3 text-left text-foreground transition hover:bg-muted"
      >
        <span className="text-lg">{"\u21A9"}</span>
        <span className="text-sm font-medium">ログアウト</span>
      </Link>
    </>
  );
}

function UserSummary({ user, userInitial }: { user: ShellUser | null; userInitial: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-4">
      {user?.avatarUrl ? (
        <Image
          src={user.avatarUrl}
          alt={user.name ?? ""}
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {userInitial}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {user?.name ?? "Unknown"}
        </p>
        {user?.displayUserId ? (
          <p className="truncate text-xs text-muted-foreground">
            @{user.displayUserId}
          </p>
        ) : (
          <p className="truncate text-xs text-muted-foreground">
            ユーザーID未設定
          </p>
        )}
      </div>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isReady, user, updateDisplayName, updateDisplayUserId } = useSessionUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [nameEditOpen, setNameEditOpen] = useState(false);
  const [userIdEditOpen, setUserIdEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isReady && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isReady, pathname, router, user]);

  useEffect(() => {
    if (pathname === "/search") {
      const q = searchParams.get("q") ?? "";
      setSearchQuery(q);
    }
  }, [pathname, searchParams]);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    const profileSearchId = parseDisplayUserIdSearchQuery(searchQuery);
    if (profileSearchId) {
      router.push(`/users/${profileSearchId}`);
      return;
    }

    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/search");
    }
  }, [router, searchQuery]);

  const handleNameEditToggle = useCallback(() => {
    setNameEditOpen((prev) => {
      const next = !prev;
      if (next) {
        setUserIdEditOpen(false);
      }
      return next;
    });
  }, []);

  const handleUserIdEditToggle = useCallback(() => {
    setUserIdEditOpen((prev) => {
      const next = !prev;
      if (next) {
        setNameEditOpen(false);
      }
      return next;
    });
  }, []);

  const handleSettingsToggle = useCallback(() => {
    setSettingsExpanded((prev) => !prev);
  }, []);

  const userInitial = getUserInitial(user?.name);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed left-1/2 top-0 z-30 flex h-14 w-full max-w-[480px] -translate-x-1/2 items-center border-b border-border bg-card px-4">
        <div className="flex w-full items-center justify-between gap-3">
          <Link
            href="/rankings"
            className="shrink-0 text-lg font-bold text-primary"
          >
            {APP_BRAND}
          </Link>

          <div className="relative min-w-0 flex-1">
            <input
              type="text"
              placeholder="検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit();
                }
              }}
              className="h-9 w-full rounded-md border border-border bg-input px-3 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    if (pathname === "/search") {
                      router.push("/search");
                    }
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-transparent text-muted-foreground transition hover:bg-muted"
                  aria-label="クリア"
                >
                  <span className="text-xs leading-none">{"\u2715"}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-transparent text-muted-foreground transition hover:bg-muted"
                aria-label="検索"
              >
                <SearchIcon />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSidebarToggle}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground min-[1040px]:hidden overflow-hidden"
            aria-label="メニュー"
          >
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt=""
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            ) : (
              userInitial
            )}
          </button>
        </div>
      </header>

      <div className="h-14 w-full shrink-0" aria-hidden="true" />

      <main className="mx-auto w-full max-w-[480px] px-4 py-6">
        {children}
      </main>

      <aside
        className="fixed top-0 z-26 hidden h-screen flex-col border-l border-border bg-card min-[1040px]:flex"
        style={{
          left: "calc(50% + 240px)",
          width: "min(320px, calc(50vw - 240px))",
        }}
      >
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="text-base font-bold text-foreground">メニュー</span>
        </div>

        <UserSummary user={user} userInitial={userInitial} />

        <nav className="flex-1 overflow-y-auto py-2">
          <SettingsAccordion
            settingsExpanded={settingsExpanded}
            onToggle={handleSettingsToggle}
            nameEditOpen={nameEditOpen}
            onNameEditToggle={handleNameEditToggle}
            userIdEditOpen={userIdEditOpen}
            onUserIdEditToggle={handleUserIdEditToggle}
            user={user}
            updateDisplayName={updateDisplayName}
            updateDisplayUserId={updateDisplayUserId}
          />
        </nav>
      </aside>

      <div
        className="fixed inset-0 z-50"
        onClick={handleSidebarClose}
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          opacity: sidebarOpen ? 1 : 0,
          pointerEvents: sidebarOpen ? "auto" : "none",
          transition: "opacity 300ms ease-in-out",
        }}
      />

      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-[80vw] max-w-[320px] flex-col border-l border-border bg-card shadow-lg"
        aria-hidden={!sidebarOpen}
        style={{
          transform: sidebarOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms ease-in-out",
        }}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="text-base font-bold text-foreground">メニュー</span>
          <button
            type="button"
            onClick={handleSidebarClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-lg text-muted-foreground transition hover:bg-muted"
            aria-label="閉じる"
          >
            {"\u2715"}
          </button>
        </div>

        <UserSummary user={user} userInitial={userInitial} />

        <nav className="flex-1 overflow-y-auto py-2">
          <SettingsAccordion
            settingsExpanded={settingsExpanded}
            onToggle={handleSettingsToggle}
            nameEditOpen={nameEditOpen}
            onNameEditToggle={handleNameEditToggle}
            userIdEditOpen={userIdEditOpen}
            onUserIdEditToggle={handleUserIdEditToggle}
            user={user}
            updateDisplayName={updateDisplayName}
            updateDisplayUserId={updateDisplayUserId}
            onNavigate={handleSidebarClose}
          />
        </nav>
      </aside>
    </div>
  );
}
