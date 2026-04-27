import { useState } from "react";
import type { Screen } from "./types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: Screen) => void;
  onViewProfile?: (userId: string | null) => void;
}

export interface SidebarMenuItemConfig {
  label: string;
  screen?: Screen;
  disabled: boolean;
  comingSoon?: boolean;
  destructive?: boolean;
}

export const SETTINGS_MENU_ITEMS: SidebarMenuItemConfig[] = [
  { label: "ミュートしたユーザー", screen: "muted-blocked", disabled: false },
  { label: "ブロックしたユーザー", screen: "muted-blocked", disabled: false },
  { label: "ミュートワード", screen: "muted-blocked", disabled: false },
  { label: "通知設定", screen: "notification-settings", disabled: false },
  { label: "テーマ設定", screen: "settings", disabled: false },
  { label: "利用規約", screen: "terms", disabled: false },
  { label: "プライバシーポリシー", screen: "privacy", disabled: false },
];

// ダミーデータ
const DUMMY_USER = {
  name: "Taro Yamada",
  displayUserId: "taro_yamada",
  initial: "TY",
};

const DUMMY_STATS = {
  publicRankingCount: 12,
  followingCount: 34,
  followerCount: 56,
};

function UserSummary({
  onNavigate,
  onClose,
  onViewProfile,
}: {
  onNavigate: (screen: Screen) => void;
  onClose?: () => void;
  onViewProfile?: (userId: string | null) => void;
}) {
  const handleNav = (screen: Screen) => {
    onClose?.();
    onNavigate(screen);
  };

  const handleViewOwnProfile = () => {
    onClose?.();
    if (onViewProfile) {
      onViewProfile(null);
    } else {
      onNavigate("user-profile");
    }
  };

  return (
    <div className="border-b border-border px-4 py-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleViewOwnProfile}
          className="shrink-0 transition hover:opacity-80 bg-transparent border-none cursor-pointer p-0"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {DUMMY_USER.initial}
          </div>
        </button>
        <div className="min-w-0">
          <button
            type="button"
            onClick={handleViewOwnProfile}
            className="block truncate text-sm font-semibold text-foreground transition hover:opacity-80 bg-transparent border-none cursor-pointer p-0 text-left"
          >
            {DUMMY_USER.name}
          </button>
          <p className="truncate text-xs text-muted-foreground">
            @{DUMMY_USER.displayUserId}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="font-semibold text-foreground">{DUMMY_STATS.publicRankingCount}</span>
          <span className="text-muted-foreground">投稿</span>
        </span>
        <button
          type="button"
          onClick={() => handleNav("follow-list")}
          className="inline-flex items-center gap-1 text-xs transition hover:opacity-70 bg-transparent border-none cursor-pointer p-0"
        >
          <span className="font-semibold text-foreground">{DUMMY_STATS.followingCount}</span>
          <span className="text-muted-foreground">フォロー</span>
        </button>
        <button
          type="button"
          onClick={() => handleNav("follow-list")}
          className="inline-flex items-center gap-1 text-xs transition hover:opacity-70 bg-transparent border-none cursor-pointer p-0"
        >
          <span className="font-semibold text-foreground">{DUMMY_STATS.followerCount}</span>
          <span className="text-muted-foreground">フォロワー</span>
        </button>
      </div>
    </div>
  );
}

function SettingsAccordion({
  settingsExpanded,
  onToggle,
  onNavigate,
  onClose,
}: {
  settingsExpanded: boolean;
  onToggle: () => void;
  onNavigate: (screen: Screen) => void;
  onClose?: () => void;
}) {
  const handleNav = (screen: Screen) => {
    onClose?.();
    onNavigate(screen);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => handleNav("bookmarks")}
        className="flex w-full items-center gap-3 bg-transparent px-4 py-3 text-left text-foreground transition hover:bg-muted border-none cursor-pointer"
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
      </button>

      <button
        type="button"
        onClick={() => handleNav("thread-list")}
        className="flex w-full items-center gap-3 bg-transparent px-4 py-3 text-left text-foreground transition hover:bg-muted border-none cursor-pointer"
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
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
        <span className="text-sm font-medium">参加中のスレッド</span>
      </button>

      <button
        type="button"
        onClick={() => handleNav("self-analysis")}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted transition bg-transparent border-none cursor-pointer"
        style={{ color: "var(--foreground)" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" />
        </svg>
        <span className="text-sm">自己分析</span>
      </button>

      <button
        type="button"
        onClick={() => handleNav("premium-plan")}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted transition bg-transparent border-none cursor-pointer"
        style={{ color: "var(--foreground)" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span className="text-sm">プレミアムプラン</span>
      </button>

      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 bg-transparent px-4 py-3 text-left text-foreground transition hover:bg-muted border-none cursor-pointer"
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
            onClick={() => handleNav("user-profile")}
            className="block w-full cursor-pointer bg-transparent px-4 py-2 text-left text-sm text-foreground transition hover:bg-muted border-none"
          >
            プロフィール編集
          </button>

          {SETTINGS_MENU_ITEMS.map((item) =>
            item.screen && !item.disabled ? (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNav(item.screen!)}
                className="block w-full cursor-pointer bg-transparent px-4 py-2 text-left text-sm text-foreground transition hover:bg-muted border-none"
              >
                {item.label}
              </button>
            ) : (
              <button
                key={item.label}
                type="button"
                disabled={item.disabled}
                className={`w-full bg-transparent px-4 py-2 text-left text-sm transition border-none ${
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

      <button
        type="button"
        onClick={() => handleNav("logout-confirm")}
        className="flex w-full items-center gap-3 bg-transparent px-4 py-3 text-left text-foreground transition hover:bg-muted border-none cursor-pointer"
      >
        <span className="text-lg">{"\u21A9"}</span>
        <span className="text-sm font-medium">ログアウト</span>
      </button>
    </>
  );
}

export function Sidebar({ isOpen, onClose, onNavigate, onViewProfile }: SidebarProps) {
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  const handleSettingsToggle = () => {
    setSettingsExpanded((prev) => !prev);
  };

  return (
    <>
      {/* デスクトップサイドバー */}
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

        <UserSummary onNavigate={onNavigate} onViewProfile={onViewProfile} />

        <nav className="flex-1 overflow-y-auto py-2">
          <SettingsAccordion
            settingsExpanded={settingsExpanded}
            onToggle={handleSettingsToggle}
            onNavigate={onNavigate}
          />
        </nav>
      </aside>

      {/* モバイルオーバーレイ */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 300ms ease-in-out",
        }}
      />

      {/* モバイルサイドバー（右スライドイン） */}
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-[80vw] max-w-[320px] flex-col border-l border-border bg-card shadow-lg"
        aria-hidden={!isOpen}
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms ease-in-out",
        }}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="text-base font-bold text-foreground">メニュー</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-lg text-muted-foreground transition hover:bg-muted border-none cursor-pointer"
            aria-label="閉じる"
          >
            {"\u2715"}
          </button>
        </div>

        <UserSummary onNavigate={onNavigate} onClose={onClose} onViewProfile={onViewProfile} />

        <nav className="flex-1 overflow-y-auto py-2">
          <SettingsAccordion
            settingsExpanded={settingsExpanded}
            onToggle={handleSettingsToggle}
            onNavigate={onNavigate}
            onClose={onClose}
          />
        </nav>
      </aside>
    </>
  );
}
