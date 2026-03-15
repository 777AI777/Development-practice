"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useSessionUser } from "@/hooks/use-session-user";
import { useToast } from "@/components/toast-provider";
import { getUserInitial } from "@/lib/user-utils";

const APP_BRAND = "OKINY";

interface AppShellProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

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

interface SidebarMenuItemConfig {
  label: string;
  disabled: boolean;
  comingSoon?: boolean;
}

const SETTINGS_MENU_ITEMS: SidebarMenuItemConfig[] = [
  { label: "プロフィール編集", disabled: true, comingSoon: true },
  { label: "通知設定", disabled: true, comingSoon: true },
  { label: "テーマ設定", disabled: true, comingSoon: true },
  { label: "利用規約", disabled: true },
  { label: "プライバシーポリシー", disabled: true },
];

const MAX_DISPLAY_NAME_LENGTH = 30;

function DisplayNameEditor({
  user,
  updateDisplayName,
  onDone,
}: {
  user: { name?: string; email?: string } | null;
  updateDisplayName: (name: string) => void;
  onDone: () => void;
}) {
  const { pushToast } = useToast();
  const [displayName, setDisplayName] = useState(user?.name ?? "");

  const isDirty = useMemo(
    () => displayName.trim() !== (user?.name ?? ""),
    [displayName, user?.name],
  );
  const canSave = displayName.trim().length > 0 && isDirty;

  const save = () => {
    if (!canSave) return;
    updateDisplayName(displayName.trim());
    pushToast({ type: "success", message: "表示名を保存しました。" });
    onDone();
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
        placeholder="表示名"
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

function SettingsAccordion({
  settingsExpanded,
  onToggle,
  nameEditOpen,
  onNameEditToggle,
  user,
  updateDisplayName,
  onNavigate,
}: {
  settingsExpanded: boolean;
  onToggle: () => void;
  nameEditOpen: boolean;
  onNameEditToggle: () => void;
  user: { name?: string; email?: string } | null;
  updateDisplayName: (name: string) => void;
  onNavigate?: () => void;
}) {
  return (
    <>
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
            className="w-full bg-transparent px-4 py-2 text-left text-sm text-foreground transition cursor-pointer hover:bg-muted"
          >
            表示名編集
          </button>

          {nameEditOpen && (
            <DisplayNameEditor
              user={user}
              updateDisplayName={updateDisplayName}
              onDone={onNameEditToggle}
            />
          )}

          {SETTINGS_MENU_ITEMS.map((item) => (
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
          ))}
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

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isReady, user, updateDisplayName } = useSessionUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [nameEditOpen, setNameEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isReady && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isReady, pathname, router, user]);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/search");
    }
  }, [router, searchQuery]);

  const handleNameEditToggle = useCallback(() => {
    setNameEditOpen((prev) => !prev);
  }, []);

  const handleSettingsToggle = useCallback(() => {
    setSettingsExpanded((prev) => !prev);
  }, []);

  const userInitial = getUserInitial(user?.name);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-1/2 z-30 flex h-14 w-full max-w-[480px] -translate-x-1/2 items-center border-b border-border bg-card px-4">
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
              placeholder="タグで検索... (Coming Soon)"
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
                  onClick={() => setSearchQuery("")}
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
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground min-[1040px]:hidden"
            aria-label="メニュー"
          >
            {userInitial}
          </button>
        </div>
      </header>

      {/* Header spacer */}
      <div className="h-14 w-full shrink-0" aria-hidden="true" />

      {/* Main content */}
      <main className="mx-auto w-full max-w-[480px] px-4 py-6">
        {children}
      </main>

      {/* Desktop side panel */}
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

        <div className="flex items-center gap-3 border-b border-border px-4 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {userInitial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {user?.name ?? "Unknown"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email ?? ""}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <SettingsAccordion
            settingsExpanded={settingsExpanded}
            onToggle={handleSettingsToggle}
            nameEditOpen={nameEditOpen}
            onNameEditToggle={handleNameEditToggle}
            user={user}
            updateDisplayName={updateDisplayName}
          />
        </nav>
      </aside>

      {/* Mobile sidebar overlay */}
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

      {/* Mobile sidebar */}
      <aside
        className="fixed top-0 right-0 z-50 flex h-full w-[80vw] max-w-[320px] flex-col border-l border-border bg-card shadow-lg"
        aria-hidden={!sidebarOpen}
        style={{
          transform: sidebarOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms ease-in-out",
        }}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="text-base font-bold text-foreground">
            メニュー
          </span>
          <button
            type="button"
            onClick={handleSidebarClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-lg text-muted-foreground transition hover:bg-muted"
            aria-label="閉じる"
          >
            {"\u2715"}
          </button>
        </div>

        <div className="flex items-center gap-3 border-b border-border px-4 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {userInitial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {user?.name ?? "Unknown"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email ?? ""}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <SettingsAccordion
            settingsExpanded={settingsExpanded}
            onToggle={handleSettingsToggle}
            nameEditOpen={nameEditOpen}
            onNameEditToggle={handleNameEditToggle}
            user={user}
            updateDisplayName={updateDisplayName}
            onNavigate={handleSidebarClose}
          />
        </nav>
      </aside>
    </div>
  );
}
