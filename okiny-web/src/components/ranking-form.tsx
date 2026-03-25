"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { TagCombobox } from "@/components/tag-combobox";
import { HttpPublishedApiClient } from "@/lib/publish/http-published-api-client";
import type { RankingInput, RankingItems } from "@/lib/types";

const apiClient = new HttpPublishedApiClient();

interface RankingFormProps {
  initialValue?: RankingInput;
  initialTagName?: string;
  initialNewTagName?: string;
  submitLabel: string;
  onSubmit: (value: RankingInput) => Promise<void>;
  onSaveDraft?: (value: RankingInput & { newTagName?: string; selectedTagName?: string }) => Promise<void>;
  onDraftList?: () => void;
  onCancel?: () => void;
  onBack?: () => void;
  autosaveKey?: string;
}

function toRankingItems(items: string[]): RankingItems {
  return [items[0] ?? "", items[1] ?? "", items[2] ?? "", items[3] ?? "", items[4] ?? ""];
}

interface SortableItemProps {
  id: string;
  rank: number;
  value: string;
  onChange: (value: string) => void;
}

function SortableItem({ id, rank, value, onChange }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const isFirst = rank === 1;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    opacity: isDragging ? 0.5 : 1,
    borderBottom: "1px solid var(--border)",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-3 bg-card sm:gap-3 sm:px-6"
    >
      <span
        className="cursor-grab touch-none text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        {"⠿"}
      </span>
      <span
        className={`w-6 shrink-0 text-center sm:w-8 ${isFirst ? "text-xl font-bold sm:text-2xl" : "text-base font-semibold"}`}
        style={{
          color: isFirst
            ? "var(--primary)"
            : "var(--muted-foreground)",
        }}
      >
        {rank}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`min-w-0 flex-1 border border-border rounded-md px-2 py-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none ${isFirst ? "text-base font-semibold" : "text-sm"}`}
        placeholder={`順位 ${rank}`}
      />
    </div>
  );
}

function validateInput(value: RankingInput, newTagName: string): string | null {
  if (!value.title.trim()) {
    return "タイトルは必須です。";
  }
  if (!value.tagId.trim() && !newTagName.trim()) {
    return "タグは必須です。";
  }
  if (!value.items.some((item) => item.trim().length > 0)) {
    return "ランキング順位は1つ以上入力してください。";
  }
  return null;
}

export function RankingForm({
  initialValue,
  initialTagName,
  initialNewTagName,
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
      tagId: "",
      items: ["", "", "", "", ""],
    },
  );
  const [newTagName, setNewTagName] = useState(initialNewTagName ?? "");
  const [tagDisplayName, setTagDisplayName] = useState(initialTagName ?? initialNewTagName ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [autosavedAt, setAutosavedAt] = useState<string | null>(null);

  const dndContextId = useId();
  const itemIdsRef = useRef<string[]>(
    Array.from({ length: 5 }, (_, i) => `item-${i}`),
  );
  const [itemIds, setItemIds] = useState<string[]>(itemIdsRef.current);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = itemIds.indexOf(String(active.id));
    const newIndex = itemIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    const newItemIds = arrayMove(itemIds, oldIndex, newIndex);
    setItemIds(newItemIds);

    setIsDirty(true);
    setForm((prev) => {
      const newItems = arrayMove([...prev.items], oldIndex, newIndex);
      return { ...prev, items: toRankingItems(newItems) };
    });
  };

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
        newTagName?: string;
        tagDisplayName?: string;
      };
      if (!parsed.form) {
        return;
      }
      setForm(parsed.form);
      setNewTagName(parsed.newTagName ?? "");
      setTagDisplayName(parsed.tagDisplayName ?? "");
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
          newTagName,
          tagDisplayName,
        }),
      );
      setAutosaveState("saved");
      setAutosavedAt(updatedAt);
    }, 1200);
    return () => {
      window.clearTimeout(timer);
    };
  }, [autosaveStorageKey, form, isDirty, newTagName, tagDisplayName]);

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
    const validation = validateInput(form, newTagName);
    if (validation) {
      setErrorMessage(validation);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      let resolvedTagId = form.tagId;

      if (!resolvedTagId && newTagName.trim()) {
        try {
          const createdTag = await apiClient.createTag(newTagName.trim());
          resolvedTagId = createdTag.id;
        } catch (error: unknown) {
          const message =
            error instanceof Error
              ? error.message
              : "タグの作成に失敗しました。";
          setErrorMessage(message);
          return;
        }
      }

      const resolvedForm: RankingInput = {
        ...form,
        tagId: resolvedTagId,
      };

      await onSubmit(resolvedForm);
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
      await onSaveDraft({
        ...form,
        ...(newTagName.trim() ? { newTagName: newTagName.trim() } : {}),
        ...(tagDisplayName.trim() && !newTagName.trim() ? { selectedTagName: tagDisplayName.trim() } : {}),
      });
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

  const handleTagSelect = (tagId: string, tagName: string) => {
    setIsDirty(true);
    setForm((prev) => ({ ...prev, tagId }));
    setTagDisplayName(tagName);
    setNewTagName("");
  };

  const handleTagCreate = (name: string) => {
    setIsDirty(true);
    setForm((prev) => ({ ...prev, tagId: "" }));
    setNewTagName(name);
    setTagDisplayName(name);
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
      {/* Header: [← back] [title input] [spacer] */}
      <div className="flex items-center justify-between gap-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center bg-transparent text-lg font-bold text-foreground"
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
          className="min-w-0 flex-1 rounded-md border border-border bg-transparent px-2 py-1 text-center text-base font-bold text-foreground shadow-none placeholder:font-bold placeholder:text-muted-foreground/40 focus:outline-none sm:text-xl"
          placeholder="ランキングタイトル"
        />
        <div className="h-8 w-8 shrink-0" />
      </div>

      {/* Tag + action buttons row */}
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <TagCombobox
            value={form.tagId}
            displayName={tagDisplayName}
            newTagName={newTagName || undefined}
            onSelect={handleTagSelect}
            onCreate={handleTagCreate}
          />
        </div>
        {onDraftList ? (
          <button
            type="button"
            onClick={onDraftList}
            className="shrink-0 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
          >
            下書き一覧
          </button>
        ) : null}
        {onSaveDraft ? (
          <button
            type="button"
            onClick={() => void saveDraft()}
            disabled={isSavingDraft}
            className="shrink-0 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
          >
            {isSavingDraft ? "保存中..." : "下書き保存"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={isSubmitting}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? "送信中..." : submitLabel}
        </button>
      </div>

      {/* Ranking items */}
      <div className="rounded-xl overflow-hidden bg-card">
        <DndContext
          id={dndContextId}
          sensors={sensors}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {form.items.map((item, index) => (
              <SortableItem
                key={itemIds[index]}
                id={itemIds[index]}
                rank={index + 1}
                value={item}
                onChange={(v) => setItem(index, v)}
              />
            ))}
          </SortableContext>
        </DndContext>
        <div
          className="py-3 px-3 sm:px-6 flex items-center justify-center cursor-not-allowed opacity-60 transition bg-card"
          style={{ borderTop: "1px solid var(--border)" }}
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
