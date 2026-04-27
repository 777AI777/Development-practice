import { AppHeader } from "./AppHeader";
import type { Screen } from "./types";

interface LogoutConfirmScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function LogoutConfirmScreen({ onNavigate }: LogoutConfirmScreenProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader onNavigate={onNavigate} />

      <div className="mx-auto max-w-[480px] px-4 pb-24 pt-4">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-foreground">
              ログアウトしますか？
            </h1>

            <p className="mt-3 text-sm text-muted-foreground">
              ログアウトすると、再度ログインが必要になります。
            </p>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={() => onNavigate("login")}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                ログアウトする
              </button>
              <button
                type="button"
                onClick={() => onNavigate("settings")}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
