import { useState, useCallback } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { LogoutConfirmScreen } from "./components/LogoutConfirmScreen";
import { RankingListScreen } from "./components/RankingListScreen";
import { RankingDetailScreen } from "./components/RankingDetailScreen";
import { RankingFormScreen } from "./components/RankingFormScreen";
import { DeleteConfirmScreen } from "./components/DeleteConfirmScreen";
import { DraftsScreen } from "./components/DraftsScreen";
import { TagSearchScreen } from "./components/TagSearchScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { Sidebar, SETTINGS_MENU_ITEMS } from "./components/Sidebar";

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

type TabId = "myrank" | "recommend" | "following";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [activeTab, setActiveTab] = useState<TabId>("myrank");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  const handleNavigate = useCallback((screen: Screen) => {
    setCurrentScreen(screen);
  }, []);

  const handleSearchSubmit = useCallback(
    (query: string) => {
      setSearchQuery(query);
      handleNavigate("search");
    },
    [handleNavigate]
  );

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case "login":
        return <LoginScreen onNavigate={handleNavigate} />;

      case "rankings":
        return (
          <RankingListScreen
            onNavigate={handleNavigate}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onSidebarToggle={handleSidebarToggle}
          />
        );

      case "ranking-detail":
        return (
          <RankingDetailScreen
            onNavigate={handleNavigate}
            onSidebarToggle={handleSidebarToggle}
          />
        );

      case "ranking-new":
        return (
          <RankingFormScreen
            mode="new"
            onNavigate={handleNavigate}
            onSidebarToggle={handleSidebarToggle}
          />
        );

      case "ranking-edit":
        return (
          <RankingFormScreen
            mode="edit"
            onNavigate={handleNavigate}
            onSidebarToggle={handleSidebarToggle}
          />
        );

      case "delete-confirm":
        return <DeleteConfirmScreen onNavigate={handleNavigate} />;

      case "drafts":
        return (
          <DraftsScreen
            onNavigate={handleNavigate}
            onSidebarToggle={handleSidebarToggle}
          />
        );

      case "search":
        return (
          <TagSearchScreen
            onNavigate={handleNavigate}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSearch={handleSearchSubmit}
            onSidebarToggle={handleSidebarToggle}
          />
        );

      case "settings":
        return <SettingsScreen onNavigate={handleNavigate} />;

      case "logout-confirm":
        return <LogoutConfirmScreen onNavigate={handleNavigate} />;

      default:
        return <LoginScreen onNavigate={handleNavigate} />;
    }
  };

  const showSidePanelScreens: Screen[] = [
    "rankings",
    "ranking-detail",
    "ranking-new",
    "ranking-edit",
    "search",
    "drafts",
  ];
  const showSidePanel = showSidePanelScreens.includes(currentScreen);

  return (
    <div className="flex min-h-screen md:justify-center">
      <div className="flex-1 max-w-[480px] mx-auto relative">
        {renderScreen()}
      </div>

      {showSidePanel && (
        <aside
          className="hidden md:flex flex-col w-[320px] border-l shrink-0 sticky top-0 h-screen"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
          }}
        >
          <div
            className="h-14 flex items-center px-4 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <span
              className="font-bold text-base"
              style={{ color: "var(--foreground)" }}
            >
              メニュー
            </span>
          </div>

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

          <nav className="flex-1 py-2 overflow-y-auto">
            <button
              type="button"
              onClick={() => setSettingsExpanded((prev) => !prev)}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted transition bg-transparent border-none cursor-pointer"
              style={{ color: "var(--foreground)" }}
            >
              <span className="text-lg">⚙</span>
              <span className="text-sm font-medium flex-1">設定</span>
              <span
                className={`text-xs font-bold transition-transform ${settingsExpanded ? "rotate-0" : "-rotate-90"}`}
                style={{ color: "var(--muted-foreground)" }}
              >
                ▼
              </span>
            </button>

            {settingsExpanded && (
              <div className="pl-10">
                {SETTINGS_MENU_ITEMS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    disabled={item.disabled}
                    onClick={() => {
                      if (item.screen) {
                        handleNavigate(item.screen);
                      }
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition bg-transparent border-none ${
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
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => handleNavigate("drafts")}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted transition bg-transparent border-none cursor-pointer"
              style={{ color: "var(--foreground)" }}
            >
              <span className="text-lg">📝</span>
              <span className="text-sm font-medium">下書き</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate("logout-confirm")}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted transition bg-transparent border-none cursor-pointer"
              style={{ color: "var(--foreground)" }}
            >
              <span className="text-lg">🚪</span>
              <span className="text-sm font-medium">ログアウト</span>
            </button>
          </nav>
        </aside>
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
