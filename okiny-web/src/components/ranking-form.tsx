"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

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

import { autosaveRepository } from "@/lib/autosave/client-repository";
import { BackButton } from "@/components/back-button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TagCombobox } from "@/components/tag-combobox";
import { useToast } from "@/components/toast-provider";
import { isFormEmpty } from "@/lib/drafts/is-form-empty";
import { HttpPublishedApiClient, PublishedApiError } from "@/lib/publish/http-published-api-client";
import { buildSessionExpiredToast } from "@/lib/session-expired-toast";
import type { RankingInput, RankingItems } from "@/lib/types";

const apiClient = new HttpPublishedApiClient();

interface RankingFormProps {
  initialValue?: RankingInput;
  initialTagName?: string;
  initialNewTagName?: string;
  submitLabel: string;
  onSubmit: (value: RankingInput) => Promise<void>;
  onSaveDraft?: (value: RankingInput & { newTagName?: string; selectedTagName?: string }) => Promise<boolean>;
  onDraftList?: () => void;
  onCancel?: () => void;
  onBack?: () => void;
  autosaveConfig?: { userId: string; key: string };
  isDraftMode?: boolean;
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
  autosaveConfig,
  isDraftMode,
}: RankingFormProps) {
  const { pushToast } = useToast();
  const [form, setForm] = useState<RankingInput>(
    initialValue
      ? { ...initialValue, isPublic: initialValue.isPublic ?? true }
      : {
          title: "",
          tagId: "",
          items: ["", "", "", "", ""],
          isPublic: true,
        },
  );
  const [newTagName, setNewTagName] = useState(initialNewTagName ?? "");
  const [tagDisplayName, setTagDisplayName] = useState(initialTagName ?? initialNewTagName ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [autosavedAt, setAutosavedAt] = useState<Date | null>(null);

  // initialValue propの変更にフォームを追従させる（復元確認ダイアログ後など）
  // isDirtyがtrueの場合はユーザー編集中なので上書きしない
  // eslint-disable-next-line react-hooks/exhaustive-deps -- isDirtyは意図的に依存配列から除外
  useEffect(() => {
    if (initialValue && !isDirty) {
      setForm(initialValue);
    }
  }, [initialValue]);

  // initialTagName, initialNewTagNameの変更にも追従する
  // undefinedでない場合（空文字含む）はstateを更新する。
  // undefinedは「まだ値が決まっていない」を意味するので無視する。
  // eslint-disable-next-line react-hooks/exhaustive-deps -- isDirtyは意図的に依存配列から除外
  useEffect(() => {
    if (!isDirty) {
      if (initialTagName !== undefined) {
        setTagDisplayName(initialTagName);
      }
      if (initialNewTagName !== undefined) {
        setNewTagName(initialNewTagName);
      }
    }
  }, [initialTagName, initialNewTagName]);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [navigationDialogOpen, setNavigationDialogOpen] = useState(false);
  const [pendingNavigationUrl, setPendingNavigationUrl] = useState<string | null>(null);

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

  const buildDraftPayload = useCallback(() => ({
    ...form,
    ...(newTagName.trim() ? { newTagName: newTagName.trim() } : {}),
    ...(tagDisplayName.trim() && !newTagName.trim() ? { selectedTagName: tagDisplayName.trim() } : {}),
  }), [form, newTagName, tagDisplayName]);

  useEffect(() => {
    if (!autosaveConfig || !isDirty) return;
    const { userId, key } = autosaveConfig;
    const timer = window.setTimeout(() => {
      void autosaveRepository.save(userId, key, buildDraftPayload()).then(() => {
        setAutosavedAt(new Date());
      });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [autosaveConfig, form, isDirty, newTagName, tagDisplayName, buildDraftPayload]);

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

  // SPA内部リンクの遷移ガード
  useEffect(() => {
    if (!isDirty || isDraftMode) return;

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/")) return;
      if (anchor.target === "_blank") return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      e.stopPropagation();
      setPendingNavigationUrl(href);
      setNavigationDialogOpen(true);
    };

    window.addEventListener("click", handleClick, true);
    return () => window.removeEventListener("click", handleClick, true);
  }, [isDirty, isDraftMode]);

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
          if (error instanceof PublishedApiError && error.code === "UNAUTHORIZED") {
            pushToast(buildSessionExpiredToast());
            return;
          }
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
      if (autosaveConfig) {
        void autosaveRepository.delete(autosaveConfig.userId, autosaveConfig.key);
      }
      setIsDirty(false);
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
      const success = await onSaveDraft(buildDraftPayload());
      if (success) {
        if (autosaveConfig) {
          void autosaveRepository.delete(autosaveConfig.userId, autosaveConfig.key);
        }
        setForm({ title: "", tagId: "", items: ["", "", "", "", ""], isPublic: true });
        setNewTagName("");
        setTagDisplayName("");
        setIsDirty(false);
        onDraftList?.();
      }
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

  const clearAutosaveAndBack = (callback: () => void) => {
    if (autosaveConfig) {
      void autosaveRepository.delete(autosaveConfig.userId, autosaveConfig.key);
    }
    callback();
  };

  const triggerCancel = () => {
    if (!onCancel) {
      return;
    }
    if (isDraftMode) {
      onCancel();
      return;
    }
    if (isDirty) {
      setCancelDialogOpen(true);
      return;
    }
    clearAutosaveAndBack(onCancel);
  };

  const handleCancelConfirm = () => {
    setCancelDialogOpen(false);
    if (onCancel) {
      clearAutosaveAndBack(onCancel);
    }
  };

  const triggerBack = () => {
    if (!onBack) return;

    if (isDraftMode) {
      onBack();
      return;
    }

    if (isFormEmpty(form, newTagName)) {
      // 空なら即戻る + autosave クリア
      clearAutosaveAndBack(onBack);
      return;
    }

    if (isDirty) {
      setDiscardDialogOpen(true);
      return;
    }

    onBack();
  };

  const handleDiscardConfirm = () => {
    setDiscardDialogOpen(false);
    if (onBack) {
      clearAutosaveAndBack(onBack);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header: [← back] [title input] [spacer] */}
      <div className="flex items-center justify-between gap-2">
        {onBack ? (
          <BackButton onClick={triggerBack} />
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
      {newTagName ? (
        <p className="text-xs text-muted-foreground">
          {"新しいタグは他のユーザーにも表示されます"}
        </p>
      ) : null}

      {/* 公開/非公開トグル */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setIsDirty(true);
            setForm((prev) => ({ ...prev, isPublic: !prev.isPublic }));
          }}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            form.isPublic ? "bg-primary" : "bg-muted"
          }`}
          role="switch"
          aria-checked={form.isPublic}
          aria-label={form.isPublic ? "公開" : "非公開"}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              form.isPublic ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          {form.isPublic ? (
            <>
              {/* 公開アイコン（解錠） */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-muted-foreground" aria-hidden="true">
                <path d="M14.5 1A4.5 4.5 0 0 0 10 5.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-3.5V5.5a3 3 0 1 1 6 0v1a.75.75 0 0 0 1.5 0v-1A4.5 4.5 0 0 0 14.5 1Z" />
              </svg>
              {"公開"}
            </>
          ) : (
            <>
              {/* 非公開アイコン（施錠） */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-muted-foreground" aria-hidden="true">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
              </svg>
              {"非公開"}
            </>
          )}
        </span>
        {autosaveConfig && autosavedAt ? (
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {"自動保存済み "}
            {autosavedAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
          </span>
        ) : null}
      </div>
      {form.isPublic ? (
        <p className="text-xs text-muted-foreground">
          {"公開にすると他のユーザーがこのランキングを参照できます"}
        </p>
      ) : null}

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

      <ConfirmDialog
        open={cancelDialogOpen}
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelDialogOpen(false)}
        title="未保存の変更があります"
        message="破棄して戻りますか？"
        confirmLabel="破棄する"
        variant="destructive"
      />

      <ConfirmDialog
        open={discardDialogOpen}
        onConfirm={handleDiscardConfirm}
        onCancel={() => setDiscardDialogOpen(false)}
        title="未保存の変更があります"
        message="破棄して戻りますか？"
        confirmLabel="破棄する"
        variant="destructive"
      />

      <ConfirmDialog
        open={navigationDialogOpen}
        onConfirm={() => {
          setNavigationDialogOpen(false);
          if (pendingNavigationUrl) {
            const url = pendingNavigationUrl;
            void (async () => {
              if (autosaveConfig) {
                try {
                  await autosaveRepository.delete(autosaveConfig.userId, autosaveConfig.key);
                } catch {
                  // IndexedDB cleanup failed — non-critical
                }
              }
              window.location.href = url;
            })();
          }
        }}
        onCancel={() => {
          setNavigationDialogOpen(false);
          setPendingNavigationUrl(null);
        }}
        title="未保存の変更があります"
        message="破棄して移動しますか？"
        confirmLabel="破棄する"
        variant="destructive"
      />
    </div>
  );
}
