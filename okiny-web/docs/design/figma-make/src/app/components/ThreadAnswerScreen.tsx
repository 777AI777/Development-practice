import { useState } from "react";
import type { Screen } from "./types";

interface Props {
  onNavigate: (screen: Screen) => void;
  onSidebarToggle?: () => void;
}

const COMMENT_MAX_LENGTH = 140;
const ITEMS_COUNT = 3;

function BackArrowIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

export function ThreadAnswerScreen({ onNavigate }: Props) {
  const [items, setItems] = useState<string[]>(["", "", ""]);
  const [comment, setComment] = useState("");

  const handleItemChange = (index: number, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const allItemsFilled = items.every((item) => item.trim().length > 0);
  const isCommentOverLimit = comment.length > COMMENT_MAX_LENGTH;
  const canSubmit = allItemsFilled && !isCommentOverLimit;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Custom header */}
      <header
        className="fixed left-1/2 top-0 z-30 flex h-14 w-full max-w-[480px] -translate-x-1/2 items-center border-b px-4 justify-between"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <button
          type="button"
          onClick={() => onNavigate("thread-detail")}
          className="flex items-center justify-center w-8 h-8 rounded-full transition hover:opacity-70 bg-transparent border-none cursor-pointer"
          style={{ color: "var(--foreground)" }}
          aria-label="戻る"
        >
          <BackArrowIcon />
        </button>

        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
          回答する
        </span>

        <button
          type="button"
          disabled={!canSubmit}
          className="text-sm font-medium px-3 py-1.5 rounded-lg transition"
          style={{
            color: canSubmit ? "var(--primary)" : "var(--muted-foreground)",
            backgroundColor: "transparent",
            border: "none",
            cursor: canSubmit ? "pointer" : "default",
            opacity: canSubmit ? 1 : 0.5,
          }}
        >
          送信
        </button>
      </header>

      <main className="pt-14 pb-6">
        <div className="max-w-[480px] mx-auto px-4 py-4">
          {/* Theme card */}
          <div
            className="mx-0 mt-2 mb-6 p-3 rounded-lg border"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
          >
            <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
              お題
            </p>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              最近ハマっているもの
            </p>
          </div>

          {/* Items section */}
          <p className="text-sm mb-3 font-medium" style={{ color: "var(--foreground)" }}>
            好きなもの
          </p>
          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
            順位はつけません。好きなものを3つ教えてください
          </p>

          <div className="space-y-3 mb-8">
            {Array.from({ length: ITEMS_COUNT }).map((_, index) => (
              <input
                key={index}
                type="text"
                value={items[index]}
                onChange={(e) => handleItemChange(index, e.target.value)}
                placeholder={`${index + 1}つ目の好きなもの`}
                className="w-full h-12 rounded-xl border px-4 text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              />
            ))}
          </div>

          {/* Comment section */}
          <p className="text-sm mb-3 font-medium" style={{ color: "var(--foreground)" }}>
            ひとこと
          </p>

          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="ひとことコメント（任意）"
            className="w-full rounded-xl border p-4 text-sm resize-none focus:outline-none focus:ring-2"
            style={{
              backgroundColor: "var(--card)",
              borderColor: isCommentOverLimit ? "var(--destructive)" : "var(--border)",
              color: "var(--foreground)",
              lineHeight: "1.6",
            }}
          />

          {/* Comment character count */}
          <div className="flex justify-end mt-1">
            <span
              className="text-xs"
              style={{
                color: isCommentOverLimit ? "var(--destructive)" : "var(--muted-foreground)",
              }}
            >
              {comment.length} / {COMMENT_MAX_LENGTH}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
