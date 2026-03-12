import { Card } from "./ui/card";
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

interface SettingsScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface MenuItem {
  label: string;
  disabled: boolean;
  destructive?: boolean;
  screen?: Screen;
  comingSoon?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
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

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <AppHeader onNavigate={onNavigate} />

      <div className="max-w-[480px] mx-auto p-4">
        <button
          onClick={() => onNavigate("rankings")}
          className="text-sm text-muted-foreground hover:text-foreground transition mb-4 inline-block"
          style={{ color: "var(--primary)" }}
        >
          &larr; 戻る
        </button>

        <h1 className="text-xl font-bold mb-6" style={{ color: "var(--foreground)" }}>設定</h1>

        <Card className="divide-y">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.label}
              disabled={item.disabled}
              onClick={() => {
                if (item.screen) {
                  onNavigate(item.screen);
                }
              }}
              className={`w-full py-3 px-4 flex justify-between items-center text-left transition ${
                item.disabled
                  ? "text-muted-foreground cursor-not-allowed opacity-60"
                  : item.destructive
                    ? "text-destructive cursor-pointer hover:bg-muted"
                    : "cursor-pointer hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-2">
                {item.label}
                {item.comingSoon && (
                  <span className="text-xs text-muted-foreground">
                    (Coming Soon)
                  </span>
                )}
              </span>
              <span className="text-muted-foreground">&gt;</span>
            </button>
          ))}
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-8">
          OKINY v0.1.0
        </p>
      </div>
    </div>
  );
}
