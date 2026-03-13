import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
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

interface RankingFormScreenProps {
  mode: "new" | "edit";
  onNavigate: (screen: Screen) => void;
  onSidebarToggle?: () => void;
}

const TAG_OPTIONS = ["映画", "カフェ", "音楽", "旅行", "グルメ", "その他"] as const;

const EDIT_INITIAL_ITEMS = [
  "ショーシャンクの空に",
  "ゴッドファーザー",
  "ダークナイト",
  "パルプ・フィクション",
  "フォレスト・ガンプ",
];

const RANK_LABELS = ["1位", "2位", "3位", "4位", "5位"] as const;

export function RankingFormScreen({ mode, onNavigate, onSidebarToggle }: RankingFormScreenProps) {
  const isEdit = mode === "edit";

  const [title, setTitle] = useState(isEdit ? "映画トップ5" : "");
  const [tag, setTag] = useState(isEdit ? "映画" : "");
  const [items, setItems] = useState<string[]>(
    isEdit ? [...EDIT_INITIAL_ITEMS] : ["", "", "", "", ""]
  );

  const handleItemChange = (index: number, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const handleBack = () => {
    onNavigate(isEdit ? "ranking-detail" : "rankings");
  };

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: "var(--background)" }}
    >
      <AppHeader onNavigate={onNavigate} onSidebarToggle={onSidebarToggle} />

      <div className="max-w-[480px] w-full mx-auto flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="w-8 h-8 flex items-center justify-center text-lg font-bold bg-transparent border-none cursor-pointer"
              style={{ color: "var(--foreground)" }}
            >
              ←
            </button>
            <div className="flex-1 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => onNavigate("drafts")}
              >
                下書き保存
              </Button>
              <Button
                variant="default"
                onClick={() => onNavigate("rankings")}
              >
                公開する
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Label htmlFor="ranking-title" className="w-16 shrink-0">タイトル</Label>
            <Input
              id="ranking-title"
              className="flex-1"
              placeholder="ランキングタイトル"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Label htmlFor="ranking-tag" className="w-16 shrink-0">タグ</Label>
            <Select value={tag} onValueChange={setTag}>
              <SelectTrigger id="ranking-tag" className="flex-1">
                <SelectValue placeholder="タグを選択" />
              </SelectTrigger>
              <SelectContent>
                {TAG_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <Card className="p-6 space-y-3">
            <Label>ランキングアイテム</Label>
            {RANK_LABELS.map((label, index) => (
              <div key={label} className="flex items-center gap-3">
                <Label htmlFor={`item-${index}`} className="w-10 shrink-0 text-sm">
                  {label}
                </Label>
                <Input
                  id={`item-${index}`}
                  className="flex-1"
                  value={items[index]}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
