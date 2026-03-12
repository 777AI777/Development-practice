import { useState } from "react";

type Screen =
  | "login"
  | "rankings"
  | "ranking-detail"
  | "ranking-new"
  | "ranking-edit"
  | "delete-confirm"
  | "drafts"
  | "search"
  | "settings"
  | "logout-confirm";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: Screen) => void;
}

const MENU_ITEMS: { label: string; screen: Screen; icon: string }[] = [
  { label: "設定", screen: "settings", icon: "⚙" },
  { label: "ログアウト", screen: "logout-confirm", icon: "↩" },
];

interface SettingsMenuItem {
  label: string;
  disabled: boolean;
  destructive?: boolean;
  screen?: Screen;
  comingSoon?: boolean;
}

export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
  { label: "プロフィール編集", disabled: true, comingSoon: true },
  { label: "通知設定", disabled: true, comingSoon: true },
  { label: "テーマ設定", disabled: true, comingSoon: true },
  { label: "利用規約", disabled: true },
  { label: "プライバシーポリシー", disabled: true },
  {
    label: "ログアウト",
    disabled: false,
    destructive: true,
    screen: "logout-confirm",
  },
];

type SidebarView = "menu" | "settings";

export function Sidebar({ isOpen, onClose, onNavigate }: SidebarProps) {
  const [view, setView] = useState<SidebarView>("menu");

  const handleClose = () => {
    onClose();
    setView("menu");
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 transition-opacity"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
        onClick={handleClose}
      />

      <aside
        className="fixed top-0 right-0 z-50 h-full w-[80vw] max-w-[320px] border-l shadow-lg flex flex-col"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        <div
          className="h-14 flex items-center justify-between px-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          {view === "settings" ? (
            <button
              type="button"
              onClick={() => setView("menu")}
              className="w-8 h-8 flex items-center justify-center text-lg font-bold bg-transparent border-none cursor-pointer"
              style={{ color: "var(--foreground)" }}
            >
              ←
            </button>
          ) : (
            <span
              className="font-bold text-base"
              style={{ color: "var(--foreground)" }}
            >
              メニュー
            </span>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition bg-transparent border-none cursor-pointer text-lg"
            style={{ color: "var(--muted-foreground)" }}
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {view === "menu" && (
          <>
            <div
              className="flex items-center gap-3 px-4 py-4 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
              >
                TY
              </div>
              <div className="min-w-0">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: "var(--foreground)" }}
                >
                  Taro Yamada
                </p>
                <p
                  className="text-xs truncate"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  user-google-001
                </p>
              </div>
            </div>

            <nav className="flex-1 py-2">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.screen}
                  type="button"
                  onClick={() => {
                    if (item.screen === "settings") {
                      setView("settings");
                    } else {
                      handleClose();
                      onNavigate(item.screen);
                    }
                  }}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted transition bg-transparent border-none cursor-pointer"
                  style={{ color: "var(--foreground)" }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </>
        )}

        {view === "settings" && (
          <>
            <nav className="flex-1 py-2 divide-y" style={{ borderColor: "var(--border)" }}>
              {SETTINGS_MENU_ITEMS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.screen) {
                      handleClose();
                      onNavigate(item.screen);
                    }
                  }}
                  className={`w-full py-3 px-4 flex justify-between items-center text-left transition bg-transparent border-none ${
                    item.disabled
                      ? "cursor-not-allowed opacity-60"
                      : item.destructive
                        ? "cursor-pointer hover:bg-muted"
                        : "cursor-pointer hover:bg-muted"
                  }`}
                  style={{
                    color: item.destructive
                      ? "var(--destructive)"
                      : item.disabled
                        ? "var(--muted-foreground)"
                        : "var(--foreground)",
                  }}
                >
                  <span className="flex items-center gap-2">
                    {item.label}
                    {item.comingSoon && (
                      <span
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        (Coming Soon)
                      </span>
                    )}
                  </span>
                  <span style={{ color: "var(--muted-foreground)" }}>&gt;</span>
                </button>
              ))}
            </nav>

            <div className="p-4">
              <p
                className="text-xs text-center"
                style={{ color: "var(--muted-foreground)" }}
              >
                OKINY v0.1.0
              </p>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
