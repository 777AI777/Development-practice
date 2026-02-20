"use client";

import { useEffect, useMemo, useState } from "react";

import { FIXED_TAGS } from "@/lib/tags";
import type { RankingInput, RankingItems } from "@/lib/types";

interface RankingFormProps {
  initialValue?: RankingInput;
  submitLabel: string;
  onSubmit: (value: RankingInput) => Promise<void>;
  onSaveDraft?: (value: RankingInput) => Promise<void>;
  onCancel?: () => void;
  autosaveKey?: string;
}

function toRankingItems(items: string[]): RankingItems {
  return [items[0] ?? "", items[1] ?? "", items[2] ?? "", items[3] ?? "", items[4] ?? ""];
}

function validateInput(value: RankingInput): string | null {
  if (!value.title.trim()) {
    return "Title is required.";
  }
  if (!value.tagId.trim()) {
    return "Tag is required.";
  }
  if (value.items.some((item) => !item.trim())) {
    return "All 5 ranking items are required.";
  }
  return null;
}

export function RankingForm({
  initialValue,
  submitLabel,
  onSubmit,
  onSaveDraft,
  onCancel,
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

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="ranking-title" className="mb-1 block text-sm font-semibold text-slate-700">
          Ranking Title
        </label>
        <input
          id="ranking-title"
          value={form.title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="e.g. Movie Top 5"
        />
      </div>

      <div>
        <label htmlFor="ranking-tag" className="mb-1 block text-sm font-semibold text-slate-700">
          Tag
        </label>
        <select
          id="ranking-tag"
          value={form.tagId}
          onChange={(event) => setTag(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {FIXED_TAGS.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-slate-700">Top 5 items</legend>
        {form.items.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="w-6 text-center text-sm font-bold">{index + 1}</span>
            <input
              value={item}
              onChange={(event) => setItem(index, event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder={`Rank ${index + 1}`}
            />
          </div>
        ))}
      </fieldset>

      {autosaveText ? (
        <p className="text-xs font-medium text-slate-500">{autosaveText}</p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        {onSaveDraft ? (
          <button
            type="button"
            onClick={() => void saveDraft()}
            disabled={isSavingDraft}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {isSavingDraft ? "Saving draft..." : "Save Draft"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={isSubmitting}
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={triggerCancel}
            className="rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
