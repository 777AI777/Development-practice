"use client";

import { useEffect, useMemo, useState } from "react";

import { FIXED_TAGS } from "@/lib/tags";
import type { RankingInput, RankingItems } from "@/lib/types";

interface RankingFormProps {
  initialValue?: RankingInput;
  submitLabel: string;
  onSubmit: (value: RankingInput) => Promise<void>;
  onSaveDraft?: (value: RankingInput) => Promise<void>;
  onDraftList?: () => void;
  onCancel?: () => void;
  onBack?: () => void;
  autosaveKey?: string;
}

function toRankingItems(items: string[]): RankingItems {
  return [items[0] ?? "", items[1] ?? "", items[2] ?? "", items[3] ?? "", items[4] ?? ""];
}

function validateInput(value: RankingInput): string | null {
  if (!value.title.trim()) {
    return "タイトルは必須です。";
  }
  if (!value.tagId.trim()) {
    return "タグは必須です。";
  }
  if (!value.items.some((item) => item.trim().length > 0)) {
    return "ランキング順位は1つ以上入力してください。";
  }
  return null;
}

export function RankingForm({
  initialValue,
  submitLabel,
  onSubmit,
  onSaveDraft,
  onDraftList,
  onCancel,
  onBack,
  autosaveKey,
}: RankingFormProps) {
  const [form, setForm] = useState<RankingInput>(
    initialValue ?? {
      title: "",
      tagId: FIXED_TAGS[0]?.id ?? "",
      items: ["", "", "", "", ""],
    },
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [autosavedAt, setAutosavedAt] = useState<string | null>(null);

  const autosaveStorageKey = useMemo(
    () => (autosaveKey ? `okiny:autosave:${autosaveKey}` : null),
    [autosaveKey],
  );

  useEffect(() => {
    if (!autosaveStorageKey) {
      return;
    }
    const raw = window.localStorage.getItem(autosaveStorageKey);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as {
        form?: RankingInput;
        updatedAt?: string;
      };
      if (!parsed.form) {
        return;
      }
      setForm(parsed.form);
      setAutosaveState("saved");
      setAutosavedAt(parsed.updatedAt ?? null);
      setIsDirty(false);
    } catch {
      // Ignore broken snapshot and continue with initial form.
    }
  }, [autosaveStorageKey]);

  useEffect(() => {
    if (!autosaveStorageKey || !isDirty) {
      return;
    }
    setAutosaveState("saving");
    const timer = window.setTimeout(() => {
      const updatedAt = new Date().toISOString();
      window.localStorage.setItem(
        autosaveStorageKey,
        JSON.stringify({
          form,
          updatedAt,
        }),
      );
      setAutosaveState("saved");
      setAutosavedAt(updatedAt);
    }, 1200);
    return () => {
      window.clearTimeout(timer);
    };
  }, [autosaveStorageKey, form, isDirty]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [isDirty]);

  const submit = async () => {
    const validation = validateInput(form);
    if (validation) {
      setErrorMessage(validation);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onSubmit(form);
      if (autosaveStorageKey) {
        window.localStorage.removeItem(autosaveStorageKey);
      }
      setIsDirty(false);
      setAutosaveState("idle");
      setAutosavedAt(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDraft = async () => {
    if (!onSaveDraft) {
      return;
    }
    setErrorMessage(null);
    setIsSavingDraft(true);
    try {
      await onSaveDraft(form);
      if (autosaveStorageKey) {
        window.localStorage.removeItem(autosaveStorageKey);
      }
      setIsDirty(false);
      setAutosaveState("idle");
      setAutosavedAt(null);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const setTitle = (title: string) => {
    setIsDirty(true);
    setForm((prev) => ({ ...prev, title }));
  };

  const setTag = (tagId: string) => {
    setIsDirty(true);
    setForm((prev) => ({ ...prev, tagId }));
  };

  const setItem = (index: number, value: string) => {
    setIsDirty(true);
    setForm((prev) => {
      const next = [...prev.items];
      next[index] = value;
      return { ...prev, items: toRankingItems(next) };
    });
  };

  const triggerCancel = () => {
    if (!onCancel) {
      return;
    }
    if (isDirty && !window.confirm("未保存の変更があります。破棄して戻りますか？")) {
      return;
    }
    onCancel();
  };

  const autosaveText = useMemo(() => {
    if (!autosaveKey) {
      return null;
    }
    if (autosaveState === "saving") {
      return "自動下書き保存: 保存中...";
    }
    if (autosaveState === "saved" && autosavedAt) {
      return `自動下書き保存: ${new Date(autosavedAt).toLocaleTimeString()} に保存済み`;
    }
    return "自動下書き保存: 未変更";
  }, [autosaveKey, autosaveState, autosavedAt]);

  const currentTagLabel = FIXED_TAGS.find((t) => t.id === form.tagId)?.label ?? form.tagId;

  return (
    <div className="space-y-4">
      {/* Header: [← back] [title input] [spacer] */}
      <div className="flex items-center justify-between gap-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center bg-transparent text-lg font-bold"
            style={{ color: "var(--foreground)" }}
            aria-label="戻る"
          >
            {"\u2190"}
          </button>
        ) : (
          <div className="h-8 w-8 shrink-0" />
        )}
        <input
          value={form.title}
          onChange={(event) => setTitle(event.target.value)}
          className="flex-1 rounded-md border border-gray-300 bg-transparent px-2 py-1 text-center text-xl font-bold text-foreground shadow-none placeholder:font-bold placeholder:text-muted-foreground/40 focus:outline-none"
          style={{ color: "var(--foreground)", fontSize: "1.25rem" }}
          placeholder="ランキングタイトル"
        />
        <div className="h-8 w-8 shrink-0" />
      </div>

      {/* Tag + action buttons row */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={form.tagId}
          onChange={(event) => setTag(event.target.value)}
          className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {FIXED_TAGS.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.label}
            </option>
          ))}
        </select>

        <div className="ml-auto flex gap-2">
          {onDraftList ? (
            <button
              type="button"
              onClick={onDraftList}
              className="rounded-lg border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground transition hover:bg-muted"
            >
              下書き一覧へ
            </button>
          ) : null}
          {onSaveDraft ? (
            <button
              type="button"
              onClick={() => void saveDraft()}
              disabled={isSavingDraft}
              className="rounded-lg border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
            >
              {isSavingDraft ? "保存中..." : "下書き保存"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={isSubmitting}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? "送信中..." : submitLabel}
          </button>
        </div>
      </div>

      {/* Ranking items */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--card)" }}>
        {form.items.map((item, index) => {
          const rank = index + 1;
          const isFirst = rank === 1;

          return (
            <div
              key={index}
              className="flex items-center gap-3 px-6 py-3"
              style={{ borderBottom: index < form.items.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <span className="cursor-grab text-muted-foreground">{"⠿"}</span>
              <span
                className={`w-8 text-center ${isFirst ? "text-2xl font-bold" : "text-base font-semibold"}`}
                style={{
                  color: isFirst
                    ? "var(--primary)"
                    : "var(--muted-foreground)",
                }}
              >
                {rank}
              </span>
              <input
                value={item}
                onChange={(event) => setItem(index, event.target.value)}
                className={`flex-1 border border-gray-300 rounded-md px-2 py-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none ${isFirst ? "text-base font-semibold" : "text-sm"}`}
                placeholder={`順位 ${rank}`}
              />
            </div>
          );
        })}
        <div
          className="py-3 px-6 flex items-center justify-center cursor-not-allowed opacity-60 transition"
          style={{
            backgroundColor: "var(--card)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <span className="text-sm font-medium text-muted-foreground">
            + アイテムを追加 (Coming Soon)
          </span>
        </div>
      </div>

      {autosaveText ? (
        <p className="text-xs font-medium text-muted-foreground">{autosaveText}</p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-semibold text-destructive">
          {errorMessage}
        </p>
      ) : null}

      {onCancel ? (
        <button
          type="button"
          onClick={triggerCancel}
          className="w-full rounded-lg border border-border bg-card py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
        >
          キャンセル
        </button>
      ) : null}
    </div>
  );
}
