import { useState, useCallback } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { AppHeader } from "./AppHeader";
import { ComingSoon } from "./ComingSoon";

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

interface RankingListScreenProps {
  onNavigate: (screen: Screen) => void;
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  onSidebarToggle?: () => void;
}

const MOCK_RANKINGS = [
  {
    id: "1",
    title: "映画トップ5",
    tag: "映画",
    items: [
      "ショーシャンクの空に",
      "ゴッドファーザー",
      "ダークナイト",
      "パルプ・フィクション",
      "フォレスト・ガンプ",
    ],
    createdAt: "2025-03-01",
  },
  {
    id: "2",
    title: "邦画ベスト5",
    tag: "映画",
    items: [
      "千と千尋の神隠し",
      "七人の侍",
      "東京物語",
      "万引き家族",
      "おくりびと",
    ],
    createdAt: "2025-03-05",
  },
  {
    id: "3",
    title: "映画音楽ベスト5",
    tag: "映画",
    items: [
      "ボヘミアン・ラプソディ",
      "ラ・ラ・ランド",
      "グレイテスト・ショーマン",
      "8 Mile",
      "ドリームガールズ",
    ],
    createdAt: "2025-03-10",
  },
  {
    id: "4",
    title: "東京カフェベスト5",
    tag: "カフェ",
    items: [
      "ブルーボトルコーヒー",
      "猿田彦珈琲",
      "STREAMER COFFEE",
      "ONIBUS COFFEE",
      "Fuglen Tokyo",
    ],
    createdAt: "2025-02-28",
  },
];

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "myrank", label: "マイランク", icon: "☰" },
  { id: "recommend", label: "おすすめ", icon: "★" },
  { id: "following", label: "フォロー中", icon: "♥" },
];

function groupByTag(
  rankings: typeof MOCK_RANKINGS
): Record<string, typeof MOCK_RANKINGS> {
  return rankings.reduce<Record<string, typeof MOCK_RANKINGS>>(
    (acc, ranking) => {
      const tag = ranking.tag;
      return {
        ...acc,
        [tag]: [...(acc[tag] ?? []), ranking],
      };
    },
    {}
  );
}

export function RankingListScreen({
  onNavigate,
  activeTab: externalTab,
  onTabChange,
  onSidebarToggle,
}: RankingListScreenProps) {
  const [internalTab, setInternalTab] = useState<TabId>("myrank");
  const activeTab = externalTab ?? internalTab;

  const handleTabChange = useCallback(
    (tab: TabId) => {
      if (onTabChange) {
        onTabChange(tab);
      } else {
        setInternalTab(tab);
      }
    },
    [onTabChange]
  );

  const [collapsedTags, setCollapsedTags] = useState<string[]>([]);

  const toggleTagAccordion = useCallback((tag: string) => {
    setCollapsedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const grouped = groupByTag(MOCK_RANKINGS);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <AppHeader onNavigate={onNavigate} onSidebarToggle={onSidebarToggle} />

      <div className="max-w-[480px] mx-auto px-4 py-6 pb-[76px]">
        {activeTab === "myrank" && (
          <>
            <div className="flex justify-end mb-4">
              <Button
                variant="default"
                className="rounded-xl"
                onClick={() => onNavigate("ranking-new")}
              >
                ＋ 新規ランキング
              </Button>
            </div>

            <div className="space-y-3">
              {Object.entries(grouped).map(([tag, rankings]) => {
                const isCollapsed = collapsedTags.includes(tag);
                const panelId = `tag-panel-${tag}`;

                return (
                  <section key={tag} className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => toggleTagAccordion(tag)}
                      aria-expanded={!isCollapsed}
                      aria-controls={panelId}
                      className="flex h-9 w-full items-center justify-between rounded-lg border px-4 text-left hover:opacity-80 transition bg-transparent cursor-pointer"
                      style={{
                        backgroundColor: "var(--muted)",
                        borderColor: "var(--border)",
                      }}
                    >
                      <span
                        className="text-sm font-bold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {tag}
                      </span>
                      <span
                        className={`text-xs font-bold transition-transform ${isCollapsed ? "-rotate-90" : "rotate-0"}`}
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        ▼
                      </span>
                    </button>

                    <div
                      id={panelId}
                      className={`space-y-3 ${isCollapsed ? "hidden" : ""}`}
                    >
                      {rankings.map((ranking) => (
                        <Card key={ranking.id} className="cursor-pointer" onClick={() => onNavigate("ranking-detail")}>
                          <CardContent className="p-4 space-y-2">
                            <h3
                              className="font-semibold"
                              style={{ color: "var(--foreground)" }}
                            >
                              {ranking.title}
                            </h3>
                            <div className="space-y-0.5">
                              {ranking.items.slice(0, 3).map((item, index) => (
                                <p
                                  key={index}
                                  className="text-sm"
                                  style={{
                                    color: "var(--muted-foreground)",
                                  }}
                                >
                                  {index + 1}. {item}
                                </p>
                              ))}
                            </div>
                            <div className="flex items-center pt-1">
                              <span
                                className="text-xs"
                                style={{
                                  color: "var(--muted-foreground)",
                                }}
                              >
                                {ranking.createdAt}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}

        {activeTab === "recommend" && (
          <ComingSoon
            title="おすすめ"
            description="おすすめランキングは現在開発中です"
          />
        )}

        {activeTab === "following" && (
          <ComingSoon
            title="フォロー中"
            description="フォロー機能は現在開発中です"
          />
        )}
      </div>

      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-[60px] border-t border-l border-r rounded-t-lg z-40 flex"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex w-full">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 bg-transparent border-none cursor-pointer relative transition"
                style={{
                  color: isActive
                    ? "var(--primary)"
                    : "var(--muted-foreground)",
                }}
              >
                {isActive && (
                  <span
                    className="absolute top-0 left-4 right-4 h-0.5 rounded-full"
                    style={{ backgroundColor: "var(--primary)" }}
                  />
                )}
                <span className="text-lg">{tab.icon}</span>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
