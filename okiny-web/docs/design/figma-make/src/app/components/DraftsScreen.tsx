import { Button } from "./ui/button";
import { Card } from "./ui/card";
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

interface DraftsScreenProps {
  onNavigate: (screen: Screen) => void;
  onSidebarToggle?: () => void;
}

interface Draft {
  id: string;
  title: string;
  tag: string;
  updatedAt: string;
}

const MOCK_DRAFTS: Draft[] = [
  { id: "d1", title: "旅行スポットベスト5", tag: "旅行", updatedAt: "2025-03-10" },
  { id: "d2", title: "おすすめラーメン5選", tag: "グルメ", updatedAt: "2025-03-08" },
];

export function DraftsScreen({ onNavigate, onSidebarToggle }: DraftsScreenProps) {
  const drafts = MOCK_DRAFTS;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <AppHeader onNavigate={onNavigate} onSidebarToggle={onSidebarToggle} />

      <div className="max-w-[480px] mx-auto p-4">
        <button
          onClick={() => onNavigate("rankings")}
          className="w-8 h-8 flex items-center justify-center text-lg font-bold bg-transparent border-none cursor-pointer mb-4"
          style={{ color: "var(--foreground)" }}
        >
          ←
        </button>

        <h1 className="text-xl font-bold mb-6" style={{ color: "var(--foreground)" }}>下書き一覧</h1>

        {drafts.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            下書きはありません
          </p>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <Card key={draft.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold" style={{ color: "var(--foreground)" }}>{draft.title}</p>
                    <Badge variant="secondary">{draft.tag}</Badge>
                    <p className="text-xs text-muted-foreground">
                      更新日: {draft.updatedAt}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate("ranking-edit")}
                  >
                    編集を続ける
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
