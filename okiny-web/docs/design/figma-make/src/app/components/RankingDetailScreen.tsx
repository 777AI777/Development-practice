import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { AppHeader } from "./AppHeader";

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

interface RankingDetailScreenProps {
  onNavigate: (screen: Screen) => void;
  onSidebarToggle?: () => void;
}

const MOCK_RANKING = {
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
};

export function RankingDetailScreen({ onNavigate, onSidebarToggle }: RankingDetailScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <AppHeader onNavigate={onNavigate} onSidebarToggle={onSidebarToggle} />

      <div className="max-w-[480px] mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center">
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center text-lg font-bold bg-transparent border-none cursor-pointer"
            style={{ color: "var(--foreground)" }}
            onClick={() => onNavigate("rankings")}
          >
            ＜
          </button>
        </div>

        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{MOCK_RANKING.title}</h1>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{MOCK_RANKING.tag}</Badge>
            <span
              className="text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              {MOCK_RANKING.createdAt}
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition bg-transparent border-none cursor-pointer"
              aria-label="メニュー"
              style={{ color: "var(--foreground)" }}
            >
              <span className="text-xl leading-none">⋯</span>
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  className="absolute right-0 top-full mt-1 z-50 w-36 rounded-lg border shadow-md py-1"
                  style={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onNavigate("ranking-edit");
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition bg-transparent border-none cursor-pointer"
                    style={{ color: "var(--foreground)" }}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onNavigate("delete-confirm");
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition bg-transparent border-none cursor-pointer"
                    style={{ color: "var(--destructive)" }}
                  >
                    削除
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {MOCK_RANKING.items.map((item, index) => {
              const rank = index + 1;
              const isFirst = rank === 1;
              const isOdd = rank % 2 === 1;

              return (
                <div
                  key={index}
                  className="py-3 px-4 flex items-center gap-3"
                  style={{
                    backgroundColor: isOdd ? "var(--muted)" : "transparent",
                  }}
                >
                  <span
                    className={`w-8 text-center ${isFirst ? "text-2xl font-bold" : "text-base font-semibold"}`}
                    style={{
                      color: isFirst ? "var(--primary)" : "var(--muted-foreground)",
                    }}
                  >
                    {rank}
                  </span>
                  <span
                    className={isFirst ? "text-base font-bold" : "text-sm"}
                    style={{ color: "var(--foreground)" }}
                  >
                    {item}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
