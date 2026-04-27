import { useState, useCallback, useEffect, useRef } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { LogoutConfirmScreen } from "./components/LogoutConfirmScreen";
import { RankingListScreen } from "./components/RankingListScreen";
import { RankingDetailScreen } from "./components/RankingDetailScreen";
import { RankingFormScreen } from "./components/RankingFormScreen";
import { DeleteConfirmScreen } from "./components/DeleteConfirmScreen";
import { DraftsScreen } from "./components/DraftsScreen";
import { SearchScreen } from "./components/SearchScreen";
import { UserProfileScreen } from "./components/UserProfileScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { BookmarksScreen } from "./components/BookmarksScreen";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { FollowListScreen } from "./components/FollowListScreen";
import { ShareScreen } from "./components/ShareScreen";
import { PrivacyScreen } from "./components/PrivacyScreen";
import { TermsScreen } from "./components/TermsScreen";
import { ProfileEditScreen } from "./components/ProfileEditScreen";
import { SelfAnalysisMenuScreen } from "./components/SelfAnalysisMenuScreen";
import { SelfAnalysisResultScreen } from "./components/SelfAnalysisResultScreen";
import { PointPurchaseScreen } from "./components/PointPurchaseScreen";
import { PointHistoryScreen } from "./components/PointHistoryScreen";
import { NotificationListScreen } from "./components/NotificationListScreen";
import { PremiumPlanScreen } from "./components/PremiumPlanScreen";
import { ThreadListScreen } from "./components/ThreadListScreen";
import { ThreadDetailScreen } from "./components/ThreadDetailScreen";
import { ThreadCreateScreen } from "./components/ThreadCreateScreen";
import type { ThreadInitialData } from "./components/ThreadCreateScreen";
import { ThreadAnswerScreen } from "./components/ThreadAnswerScreen";
import { PostStatsScreen } from "./components/PostStatsScreen";
import { NotificationSettingsScreen } from "./components/NotificationSettingsScreen";
import { Sidebar, SETTINGS_MENU_ITEMS } from "./components/Sidebar";
import type { Screen } from "./components/types";

/* --- RecommendBanner --- */

const MOCK_RECOMMENDATIONS: Record<string, { item: string; percentage: number }> = {
  default: { item: "関連アイテム", percentage: 42 },
};

function getRecommendation(itemName: string): { item: string; percentage: number } {
  return MOCK_RECOMMENDATIONS[itemName] ?? MOCK_RECOMMENDATIONS.default;
}

interface RecommendBannerProps {
  firstItem: string;
  visible: boolean;
  onClose: () => void;
  onTap?: () => void;
}

function RecommendBanner({ firstItem, visible, onClose, onTap }: RecommendBannerProps) {
  const rec = getRecommendation(firstItem);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: 56,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "center",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
          transform: visible ? "translateY(0)" : "translateY(-110%)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease",
          padding: "12px 16px",
        }}
      >
        <div
          onClick={onTap}
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: onTap ? "pointer" : "default",
          }}
        >
          {/* アイコン */}
          <div
            style={{
              flexShrink: 0,
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
          </div>

          {/* テキスト */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--foreground)",
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: "var(--primary)" }}>「{firstItem}」</span>
              を挙げた人の
              <span style={{ color: "var(--primary)" }}>{rec.percentage}%</span>
              が
              <span style={{ color: "var(--primary)" }}>「{rec.item}」</span>
              も挙げています
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "12px",
                color: "var(--muted-foreground)",
                lineHeight: 1.4,
              }}
            >
              タップして投稿を見る
            </p>
          </div>

          {/* ChevronRight */}
          {onTap && (
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
              style={{ flexShrink: 0, color: "var(--muted-foreground)" }}
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          )}

          {/* 閉じるボタン */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="閉じる"
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--muted-foreground)",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

type TabId = "myrank" | "recommend" | "following";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [previousScreen, setPreviousScreen] = useState<Screen | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("myrank");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [rankingId, setRankingId] = useState<string | null>(null);
  const [editingThread, setEditingThread] = useState<ThreadInitialData | null>(null);
  const [recommendBanner, setRecommendBanner] = useState<{ visible: boolean; firstItem: string }>({
    visible: false,
    firstItem: "",
  });
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const stored = localStorage.getItem("okiny-theme");
      return stored === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("okiny-theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const handleNavigate = useCallback((screen: Screen) => {
    setCurrentScreen((prev) => {
      setPreviousScreen(prev);
      return screen;
    });
  }, []);

  const handlePublish = useCallback((firstItem: string) => {
    setRecommendBanner({ visible: true, firstItem });
    if (bannerTimerRef.current !== null) {
      clearTimeout(bannerTimerRef.current);
    }
    bannerTimerRef.current = setTimeout(() => {
      setRecommendBanner((prev) => ({ ...prev, visible: false }));
      bannerTimerRef.current = null;
    }, 15000);
  }, []);

  const handleBannerClose = useCallback(() => {
    setRecommendBanner((prev) => ({ ...prev, visible: false }));
    if (bannerTimerRef.current !== null) {
      clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
  }, []);

  const handleBack = useCallback((fallback: Screen) => {
    setCurrentScreen((prev) => {
      const target = previousScreen ?? fallback;
      setPreviousScreen(prev);
      return target;
    });
  }, [previousScreen]);

  const handleViewProfile = useCallback((userId: string | null) => {
    setViewingUserId(userId);
    setCurrentScreen((prev) => {
      setPreviousScreen(prev);
      return "user-profile";
    });
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
            onViewProfile={handleViewProfile}
          />
        );

      case "ranking-detail":
        return (
          <RankingDetailScreen
            key={rankingId ?? "detail"}
            onNavigate={handleNavigate}
            onSidebarToggle={handleSidebarToggle}
            onViewProfile={handleViewProfile}
            onOpenRanking={(id) => setRankingId(id)}
          />
        );

      case "ranking-new":
        return (
          <RankingFormScreen
            mode="new"
            onNavigate={handleNavigate}
            onBack={() => handleBack("rankings")}
            onSidebarToggle={handleSidebarToggle}
            onSearchWithQuery={handleSearchSubmit}
            onPublish={handlePublish}
          />
        );

      case "ranking-edit":
        return (
          <RankingFormScreen
            mode="edit"
            onNavigate={handleNavigate}
            onBack={() => handleBack("ranking-detail")}
            onSidebarToggle={handleSidebarToggle}
            onSearchWithQuery={handleSearchSubmit}
            onPublish={handlePublish}
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
          <SearchScreen
            onNavigate={handleNavigate}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSearch={handleSearchSubmit}
            onSidebarToggle={handleSidebarToggle}
            onViewProfile={handleViewProfile}
          />
        );

      case "settings":
        return <SettingsScreen onNavigate={handleNavigate} theme={theme} onToggleTheme={toggleTheme} />;

      case "logout-confirm":
        return <LogoutConfirmScreen onNavigate={handleNavigate} />;

      case "follow-list":
        return <FollowListScreen onNavigate={handleNavigate} />;

      case "share":
        return <ShareScreen onNavigate={handleNavigate} />;

      case "privacy":
        return <PrivacyScreen onNavigate={handleNavigate} />;

      case "terms":
        return <TermsScreen onNavigate={handleNavigate} />;

      case "user-profile":
        return (
          <UserProfileScreen
            onNavigate={handleNavigate}
            onSidebarToggle={handleSidebarToggle}
            isOwnProfile={viewingUserId === null || viewingUserId === "taro_y"}
            viewingUserId={viewingUserId}
            onViewProfile={handleViewProfile}
          />
        );

      case "bookmarks":
        return <BookmarksScreen onNavigate={handleNavigate} onViewProfile={handleViewProfile} />;

      case "onboarding":
        return <OnboardingScreen onNavigate={handleNavigate} />;

      case "profile-edit":
        return <ProfileEditScreen onNavigate={handleNavigate} onBack={() => handleBack("user-profile")} />;

      case "muted-blocked":
        return <SettingsScreen onNavigate={handleNavigate} theme={theme} onToggleTheme={toggleTheme} initialView="muted-blocked" />;

      case "notifications":
        return <NotificationListScreen onNavigate={handleNavigate} />;

      case "premium-plan":
        return <PremiumPlanScreen onNavigate={handleNavigate} />;

      case "thread-list":
        return (
          <ThreadListScreen
            onNavigate={handleNavigate}
            onSidebarToggle={handleSidebarToggle}
          />
        );

      case "thread-detail":
        return (
          <ThreadDetailScreen
            onNavigate={handleNavigate}
            onBack={() => handleBack("thread-list")}
            onSidebarToggle={handleSidebarToggle}
            onEdit={() => {
              setEditingThread({
                theme: "最近ハマっているもの",
                description: "好きなことでも、最近始めたことでも何でもOK。ジャンルは問わないので気軽に回答してほしい。みんなの「ハマり」を知って、新しい趣味を見つけるきっかけになれば嬉しい",
                tags: ["日常"],
                borderColor: "#FFE5E5",
              });
              handleNavigate("thread-create");
            }}
          />
        );

      case "thread-create":
        return (
          <ThreadCreateScreen
            onNavigate={handleNavigate}
            onBack={() => {
              setEditingThread(null);
              handleBack(editingThread ? "thread-detail" : "thread-list");
            }}
            onSubmit={() => {
              const isEditMode = editingThread !== null;
              setEditingThread(null);
              handleNavigate(isEditMode ? "thread-detail" : "thread-list");
            }}
            onSidebarToggle={handleSidebarToggle}
            mode={editingThread ? "edit" : "create"}
            initialData={editingThread ?? undefined}
          />
        );

      case "thread-answer":
        return (
          <ThreadAnswerScreen
            onNavigate={handleNavigate}
            onSidebarToggle={handleSidebarToggle}
          />
        );

      case "self-analysis":
        return <SelfAnalysisMenuScreen onNavigate={handleNavigate} />;

      case "self-analysis-result":
        return <SelfAnalysisResultScreen onNavigate={handleNavigate} />;

      case "point-purchase":
        return <PointPurchaseScreen onNavigate={handleNavigate} />;

      case "point-history":
        return <PointHistoryScreen onNavigate={handleNavigate} />;

      case "post-stats":
        return (
          <PostStatsScreen
            onBack={() => setCurrentScreen("self-analysis")}
            onOpenRanking={() => setCurrentScreen("ranking-detail")}
          />
        );

      case "notification-settings":
        return <NotificationSettingsScreen onNavigate={handleNavigate} />;

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
    "user-profile",
    "profile-edit",
    "bookmarks",
    "follow-list",
    "thread-list",
    "thread-detail",
    "thread-create",
    "thread-answer",
    "self-analysis",
    "self-analysis-result",
  ];
  const showSidePanel = showSidePanelScreens.includes(currentScreen);

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden bg-background"
    >
      {/* 投稿時レコメンドバナー（ヘッダー直下 top:56px） */}
      <RecommendBanner
        firstItem={recommendBanner.firstItem}
        visible={recommendBanner.visible}
        onClose={handleBannerClose}
        onTap={() => {
          handleBannerClose();
          handleSearchSubmit(recommendBanner.firstItem);
        }}
      />

      <div className="relative min-h-screen">
        <main
          className="relative z-10 w-full mx-auto max-w-[480px]"
        >
          {renderScreen()}
        </main>

        {showSidePanel && (
          <aside
            className="fixed top-0 z-20 hidden h-screen flex-col border-l min-[1040px]:flex"
            style={{
              left: "calc(50% + 240px)",
              width: "min(320px, calc(50vw - 240px))",
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
                  @taro_yamada
                </p>
              </div>
            </div>

            <nav className="flex-1 py-2 overflow-y-auto">
              {/* スレッド導線 */}
              <button
                type="button"
                onClick={() => handleNavigate("thread-list")}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted transition bg-transparent border-none cursor-pointer"
                style={{ color: "var(--foreground)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="text-sm font-medium">スレッド</span>
              </button>

              {/* 自己分析導線 */}
              <button
                type="button"
                onClick={() => handleNavigate("self-analysis")}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted transition bg-transparent border-none cursor-pointer"
                style={{ color: "var(--foreground)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
                <span className="text-sm font-medium">自己分析</span>
              </button>

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
                onClick={() => handleNavigate("logout-confirm")}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted transition bg-transparent border-none cursor-pointer"
                style={{ color: "var(--foreground)" }}
              >
                <span className="text-lg">↩</span>
                <span className="text-sm font-medium">ログアウト</span>
              </button>
            </nav>
          </aside>
        )}
      </div>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleNavigate}
        onViewProfile={handleViewProfile}
      />
    </div>
  );
}
