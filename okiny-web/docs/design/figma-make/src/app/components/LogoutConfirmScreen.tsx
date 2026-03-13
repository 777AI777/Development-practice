import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
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

interface LogoutConfirmScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function LogoutConfirmScreen({ onNavigate }: LogoutConfirmScreenProps) {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <AppHeader onNavigate={onNavigate} />

      <main className="flex items-center justify-center px-4 py-16">
        <Card
          className="w-full max-w-[400px] shadow-sm rounded-xl"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
          }}
        >
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <span className="text-4xl" role="img" aria-label="警告">
              &#x26A0;&#xFE0F;
            </span>

            <h2
              className="text-xl font-bold"
              style={{ color: "var(--foreground)" }}
            >
              ログアウトしますか？
            </h2>

            <p
              className="text-sm text-center"
              style={{ color: "var(--muted-foreground)" }}
            >
              ログアウトすると、再度ログインが必要になります。
            </p>

            <div className="flex flex-col gap-3 w-full mt-2">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => onNavigate("login")}
                style={{
                  backgroundColor: "var(--destructive)",
                  color: "var(--destructive-foreground)",
                }}
              >
                ログアウトする
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => onNavigate("settings")}
                style={{ borderColor: "var(--border)" }}
              >
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
