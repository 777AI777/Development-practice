import { AppHeader } from "./AppHeader";
import type { Screen } from "./types";

interface DeleteConfirmScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function DeleteConfirmScreen({ onNavigate }: DeleteConfirmScreenProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader onNavigate={onNavigate} />

      <div className="mx-auto max-w-[480px] px-4 pb-24 pt-4">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-3xl">
              {"\u26A0\uFE0F"}
            </div>

            <h1 className="mt-4 text-xl font-bold text-foreground">
              投稿を削除しますか？
            </h1>

            <p className="mt-2 text-sm font-medium text-foreground">
              映画TOP5
            </p>

            <p className="mt-3 text-sm text-destructive">
              この操作は取り消せません
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate("ranking-detail")}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => onNavigate("rankings")}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition hover:opacity-90"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
