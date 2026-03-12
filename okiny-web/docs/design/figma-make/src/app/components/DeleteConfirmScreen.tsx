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

interface DeleteConfirmScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function DeleteConfirmScreen({ onNavigate }: DeleteConfirmScreenProps) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--background)" }}
    >
      <AppHeader onNavigate={onNavigate} />

      <div className="flex-1 flex items-center justify-center px-4">
        <Card className="max-w-sm mx-auto w-full">
          <CardContent className="p-6 space-y-4">
            <div className="text-center text-4xl">&#9888;&#65039;</div>

            <h2 className="text-lg font-bold text-center" style={{ color: "var(--foreground)" }}>
              ランキングを削除しますか？
            </h2>

            <p className="font-semibold text-center" style={{ color: "var(--foreground)" }}>映画トップ5</p>

            <p
              className="text-sm text-center"
              style={{ color: "var(--destructive)" }}
            >
              この操作は取り消せません。
            </p>

            <div className="space-y-3">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => onNavigate("rankings")}
              >
                削除する
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onNavigate("ranking-detail")}
              >
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
