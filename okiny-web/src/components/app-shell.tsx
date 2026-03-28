"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { usePageTransition } from "@/components/page-transition-provider";
import { useMyProfileStats } from "@/hooks/use-my-profile-stats";
import { useSessionUser } from "@/hooks/use-session-user";
import {
  buildUserProfilePath,
  getUserInitial,
} from "@/lib/user-utils";

const APP_BRAND = "OKINY";

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
  introduction?: string | null;
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

function SettingsAccordion({
  settingsExpanded,
  onToggle,
  profilePath,
  onNavigate,
}: {
  settingsExpanded: boolean;
  onToggle: () => void;
  profilePath: string | null;
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
          <Link
            href={profilePath ?? "#"}
            onClick={onNavigate}
            className="block w-full cursor-pointer bg-transparent px-4 py-2 text-left text-sm text-foreground transition hover:bg-muted"
          >
            プロフィール編集
          </Link>

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

function UserSummary({
  user,
  userInitial,
  profilePath,
  stats,
  onNavigate,
}: {
  user: ShellUser | null;
  userInitial: string;
  profilePath: string | null;
  stats: { publicRankingCount: number; followingCount: number; followerCount: number } | null;
  onNavigate?: () => void;
}) {
  const avatarContent = user?.avatarUrl ? (
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
  );

  return (
    <div className="border-b border-border px-4 py-4">
      <div className="flex items-center gap-3">
        {profilePath ? (
          <Link href={profilePath} onClick={onNavigate} className="shrink-0 transition hover:opacity-80">
            {avatarContent}
          </Link>
        ) : (
          avatarContent
        )}
        <div className="min-w-0">
          {profilePath ? (
            <Link href={profilePath} onClick={onNavigate} className="block truncate text-sm font-semibold text-foreground transition hover:opacity-80">
              {user?.name ?? "Unknown"}
            </Link>
          ) : (
            <p className="truncate text-sm font-semibold text-foreground">
              {user?.name ?? "Unknown"}
            </p>
          )}
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

      {stats ? (
        <div className="mt-3 flex items-center gap-4">
          <span className="inline-flex items-center gap-1 text-xs">
            <span className="font-semibold text-foreground">{stats.publicRankingCount}</span>
            <span className="text-muted-foreground">ランキング</span>
          </span>
          {profilePath ? (
            <Link href={`${profilePath}/following`} onClick={onNavigate} className="inline-flex items-center gap-1 text-xs transition hover:opacity-70">
              <span className="font-semibold text-foreground">{stats.followingCount}</span>
              <span className="text-muted-foreground">フォロー</span>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs">
              <span className="font-semibold text-foreground">{stats.followingCount}</span>
              <span className="text-muted-foreground">フォロー</span>
            </span>
          )}
          {profilePath ? (
            <Link href={`${profilePath}/followers`} onClick={onNavigate} className="inline-flex items-center gap-1 text-xs transition hover:opacity-70">
              <span className="font-semibold text-foreground">{stats.followerCount}</span>
              <span className="text-muted-foreground">フォロワー</span>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs">
              <span className="font-semibold text-foreground">{stats.followerCount}</span>
              <span className="text-muted-foreground">フォロワー</span>
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startTransitionLoading } = usePageTransition();
  const { isReady, user } = useSessionUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
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
    const normalizedQuery = searchQuery.trim();
    const currentQuery = searchParams.get("q") ?? "";
    const currentTab = searchParams.get("tab");

    if (!normalizedQuery) {
      if (pathname !== "/search" || currentQuery !== "" || currentTab !== null) {
        startTransitionLoading();
      }
      router.push("/search");
    } else {
      router.push(`/search?q=${encodeURIComponent(normalizedQuery)}`);
    }
  }, [pathname, router, searchParams, searchQuery, startTransitionLoading]);

  const handleSettingsToggle = useCallback(() => {
    setSettingsExpanded((prev) => !prev);
  }, []);

  const userInitial = getUserInitial(user?.name);
  const { stats: myStats } = useMyProfileStats(user?.id);
  const profilePath = user ? buildUserProfilePath(user) : null;

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
                      if ((searchParams.get("q") ?? "") !== "" || searchParams.get("tab") !== null) {
                        startTransitionLoading();
                      }
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

        <UserSummary user={user} userInitial={userInitial} profilePath={profilePath} stats={myStats} />

        <nav className="flex-1 overflow-y-auto py-2">
        <SettingsAccordion
          settingsExpanded={settingsExpanded}
          onToggle={handleSettingsToggle}
          profilePath={profilePath}
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

        <UserSummary user={user} userInitial={userInitial} profilePath={profilePath} stats={myStats} onNavigate={handleSidebarClose} />

        <nav className="flex-1 overflow-y-auto py-2">
        <SettingsAccordion
          settingsExpanded={settingsExpanded}
          onToggle={handleSettingsToggle}
          profilePath={profilePath}
          onNavigate={handleSidebarClose}
        />
        </nav>
      </aside>
    </div>
  );
}
