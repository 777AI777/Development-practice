"use client";

import type { RankingItems } from "@/lib/types";

interface ItemsStepProps {
  title: string;
  items: RankingItems;
  onItemChange: (index: number, value: string) => void;
  onPublish: () => void;
  onBack: () => void;
  isPublishing: boolean;
  errorMessage: string | null;
}

const RANK_LABELS = ["1位", "2位", "3位", "4位", "5位"] as const;
const PLACEHOLDERS = [
  "1位のアイテム",
  "2位のアイテム",
  "3位のアイテム",
  "4位のアイテム",
  "5位のアイテム",
] as const;

function hasAtLeastOneItem(items: RankingItems): boolean {
  return items.some((item) => item.trim() !== "");
}

export function ItemsStep({
  title,
  items,
  onItemChange,
  onPublish,
  onBack,
  isPublishing,
  errorMessage,
}: ItemsStepProps) {
  const canPublish = hasAtLeastOneItem(items) && !isPublishing;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">
          ランキングを入力しよう
        </h2>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>

      <div className="space-y-3">
        {RANK_LABELS.map((label, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-sm font-semibold text-primary">{label}</span>
            <input
              type="text"
              value={items[index]}
              onChange={(e) => onItemChange(index, e.target.value)}
              placeholder={PLACEHOLDERS[index]}
              aria-label={`${index + 1}位のアイテム`}
              disabled={isPublishing}
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ))}
      </div>

      {errorMessage !== null && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-semibold text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="flex justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isPublishing}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={!canPublish}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {isPublishing ? "公開中..." : "公開する"}
        </button>
      </div>
    </div>
  );
}
