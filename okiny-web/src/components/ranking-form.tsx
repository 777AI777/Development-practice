"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { autosaveRepository } from "@/lib/autosave/client-repository";
import { BackButton } from "@/components/back-button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TagCombobox } from "@/components/tag-combobox";
import { useToast } from "@/components/toast-provider";
import { isFormEmpty } from "@/lib/drafts/is-form-empty";
import { COMMENT_MAX_LENGTH } from "@/lib/constants";
import { HttpPublishedApiClient, PublishedApiError } from "@/lib/publish/http-published-api-client";
import { buildSessionExpiredToast } from "@/lib/session-expired-toast";
import type { RankingInput, RankingItems } from "@/lib/types";
import { BORDER_COLORS, getAccentColor, getEffectiveBorderColor } from "@/components/shared/theme-colors";
import { MARKER_ICONS, getMarkerIcon } from "@/components/shared/marker-icons";

const apiClient = new HttpPublishedApiClient();

interface RankingFormProps {
  initialValue?: RankingInput;
  initialTagName?: string;
  initialNewTagName?: string;
  submitLabel: string;
  onSubmit: (value: RankingInput, options?: { comment?: string }) => Promise<void>;
  onSaveDraft?: (value: RankingInput & { newTagName?: string; selectedTagName?: string }) => Promise<boolean>;
  onDraftList?: () => void;
  onCancel?: () => void;
  onBack?: () => void;
  autosaveConfig?: { userId: string; key: string };
  isDraftMode?: boolean;
}

function toRankingItems(items: string[]): RankingItems {
  return [items[0] ?? "", items[1] ?? "", items[2] ?? ""];
}

/* --- ChevronDown icon for accordion --- */

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.2s ease",
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/* --- Check icon for color selector --- */

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
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
    return "好きなものを1つ以上入力してください。";
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
          items: ["", "", ""],
          isPublic: true,
          borderColor: "#FFE5E5",
          markerIcon: "Heart",
        },
  );
  const [comment, setComment] = useState("");
  const [newTagName, setNewTagName] = useState(initialNewTagName ?? "");
  const [tagDisplayName, setTagDisplayName] = useState(initialTagName ?? initialNewTagName ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [autosavedAt, setAutosavedAt] = useState<Date | null>(null);

  // アコーディオン state
  const [commentOpen, setCommentOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // initialValue propの変更にフォームを追従させる（復元確認ダイアログ後など）
  // isDirtyがtrueの場合はユーザー編集中なので上書きしない
  // eslint-disable-next-line react-hooks/exhaustive-deps -- isDirtyは意図的に依存配列から除外
  useEffect(() => {
    if (initialValue && !isDirty) {
      setForm(initialValue);
    }
  }, [initialValue]);

  // initialTagName, initialNewTagNameの変更にも追従する
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

  // ユーザーが入力を修正したらバリデーションエラーを自動クリア
  useEffect(() => {
    setErrorMessage(null);
  }, [form, newTagName]);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [navigationDialogOpen, setNavigationDialogOpen] = useState(false);
  const [pendingNavigationUrl, setPendingNavigationUrl] = useState<string | null>(null);

  // 破棄を意図的に選択したフラグ（beforeunloadの二重発火防止）
  const discardIntentionalRef = useRef(false);

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
      if (discardIntentionalRef.current) {
        return;
      }
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

      const trimmedComment = comment.trim();
      await onSubmit(resolvedForm, trimmedComment ? { comment: trimmedComment } : undefined);
      setComment("");
      if (autosaveConfig) {
        void autosaveRepository.delete(autosaveConfig.userId, autosaveConfig.key).catch((err) => console.warn("autosave cleanup failed:", err));
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
          void autosaveRepository.delete(autosaveConfig.userId, autosaveConfig.key).catch((err) => console.warn("autosave cleanup failed:", err));
        }
        setForm({ title: "", tagId: "", items: ["", "", ""], isPublic: true, borderColor: "#FFE5E5", markerIcon: "Heart" });
        setComment("");
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
      void autosaveRepository.delete(autosaveConfig.userId, autosaveConfig.key).catch((err) => console.warn("autosave cleanup failed:", err));
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
      discardIntentionalRef.current = true;
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
      discardIntentionalRef.current = true;
      clearAutosaveAndBack(onBack);
    }
  };

  const accentColor = getAccentColor(form.borderColor);
  const effectiveBorderColor = getEffectiveBorderColor(form.borderColor);

  return (
    <div className="space-y-4">
      {/* Header: back + action buttons */}
      <div className="flex items-center justify-between gap-2">
        {onBack ? (
          <BackButton onClick={triggerBack} />
        ) : (
          <div className="h-8 w-8 shrink-0" />
        )}
        <div className="flex items-center gap-2">
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
      </div>

      {/* autosave indicator */}
      {autosaveConfig && autosavedAt ? (
        <div className="flex justify-end">
          <span className="text-xs text-muted-foreground">
            {"自動保存済み "}
            {autosavedAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      ) : null}

      {/* カードプレビュー（borderColorと同期した枠） */}
      {/* overflow-visible: TagCombobox のサジェスト/作成ボタンのドロップダウンが親でクリップされないようにする */}
      <div
        className="rounded-2xl border-2 overflow-visible"
        style={{
          backgroundColor: "var(--card)",
          borderColor: effectiveBorderColor,
        }}
      >
        {/* タイトルエリア */}
        <div
          className="px-5 pt-5 pb-4"
          style={{ borderBottom: `1px solid ${effectiveBorderColor}` }}
        >
          <input
            value={form.title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-xl font-bold outline-none"
            placeholder="テーマを入力"
            style={{ color: "var(--foreground)" }}
          />
        </div>

        {/* アイテム入力エリア（マーカーアイコン付き） */}
        <div
          className="px-5 py-4 space-y-4"
          style={{ borderBottom: `1px solid ${effectiveBorderColor}` }}
        >
          {form.items.map((item, index) => {
            const MarkerIcon = getMarkerIcon(form.markerIcon ?? "Heart");
            return (
            <div key={index} className="flex items-center gap-3">
              <MarkerIcon
                width={14}
                height={14}
                style={{ color: accentColor, flexShrink: 0 }}
                aria-hidden="true"
              />
              <input
                value={item}
                onChange={(e) => setItem(index, e.target.value)}
                placeholder={`好きなもの ${index + 1}`}
                className="flex-1 bg-transparent text-base outline-none border-none"
                style={{ color: "var(--foreground)" }}
              />
            </div>
            );
          })}
        </div>

        {/* コメントアコーディオン */}
        <div style={{ borderBottom: `1px solid ${effectiveBorderColor}` }}>
          <button
            type="button"
            onClick={() => setCommentOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-5 py-3 text-left transition hover:bg-muted"
            aria-expanded={commentOpen}
          >
            <span className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
              {"コメント"}
              {comment.length > 0 && (
                <span className="ml-2 text-xs" style={{ color: "var(--primary)" }}>
                  {"入力済み"}
                </span>
              )}
            </span>
            <span style={{ color: "var(--muted-foreground)" }}>
              <ChevronDownIcon open={commentOpen} />
            </span>
          </button>
          {commentOpen && (
            <div className="px-5 pb-4">
              <textarea
                id="ranking-comment"
                value={comment}
                onChange={(e) => {
                  if (e.target.value.length > COMMENT_MAX_LENGTH) return;
                  setComment(e.target.value);
                  setIsDirty(true);
                }}
                maxLength={COMMENT_MAX_LENGTH}
                rows={3}
                placeholder="コメントを入力（140文字以内）"
                className="w-full resize-none bg-transparent text-sm outline-none"
                style={{
                  color: "var(--foreground)",
                  caretColor: "var(--foreground)",
                  lineHeight: "1.5",
                }}
              />
              <div className="flex items-center justify-end mt-1">
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {comment.length}/{COMMENT_MAX_LENGTH}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* タグ選択エリア */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>
            {"タグ"}
            <span style={{ color: "var(--destructive)" }}>{" *"}</span>
          </p>
          <TagCombobox
            value={form.tagId}
            displayName={tagDisplayName}
            newTagName={newTagName || undefined}
            onSelect={handleTagSelect}
            onCreate={handleTagCreate}
          />
          {newTagName ? (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {"新しいタグは他のユーザーにも表示されます"}
            </p>
          ) : null}
        </div>
      </div>

      {/* その他の設定アコーディオン */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--card)",
        }}
      >
        <button
          type="button"
          onClick={() => setSettingsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-left transition hover:bg-muted"
          aria-expanded={settingsOpen}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {"その他の設定"}
          </span>
          <span style={{ color: "var(--muted-foreground)" }}>
            <ChevronDownIcon open={settingsOpen} />
          </span>
        </button>

        {settingsOpen && (
          <div className="px-5 pb-5 flex flex-col gap-5" style={{ borderTop: "1px solid var(--border)" }}>
            {/* 枠線色セレクター */}
            <div className="pt-4">
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>
                {"枠線の色"}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {BORDER_COLORS.map((color) => {
                  const isSelected = form.borderColor === color.value;
                  return (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {
                        setIsDirty(true);
                        setForm((prev) => ({ ...prev, borderColor: color.value }));
                      }}
                      aria-label={color.label}
                      title={color.label}
                      className="flex-shrink-0 flex items-center justify-center rounded-full transition-transform hover:scale-110"
                      style={{
                        width: "32px",
                        height: "32px",
                        backgroundColor: getEffectiveBorderColor(color.value),
                        border: isSelected
                          ? "3px solid var(--foreground)"
                          : "2px solid var(--border)",
                        boxShadow: isSelected
                          ? "0 0 0 2px var(--background), 0 0 0 4px var(--foreground)"
                          : "none",
                        outline: "none",
                        color: getAccentColor(color.value),
                      }}
                    >
                      {isSelected && <CheckIcon />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* マーカーアイコンセレクター */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>
                {"アイコン"}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {MARKER_ICONS.map((iconDef) => {
                  const isSelected = form.markerIcon === iconDef.name;
                  const Icon = getMarkerIcon(iconDef.name);
                  return (
                    <button
                      key={iconDef.name}
                      type="button"
                      onClick={() => {
                        setIsDirty(true);
                        setForm((prev) => ({ ...prev, markerIcon: iconDef.name }));
                      }}
                      aria-label={iconDef.label}
                      title={iconDef.label}
                      className="flex-shrink-0 flex items-center justify-center rounded-lg transition-colors"
                      style={{
                        width: "36px",
                        height: "36px",
                        backgroundColor: isSelected ? "var(--accent)" : "var(--muted)",
                        border: isSelected
                          ? `2px solid ${getAccentColor(form.borderColor)}`
                          : "2px solid transparent",
                        color: isSelected ? getAccentColor(form.borderColor) : "var(--muted-foreground)",
                        outline: "none",
                      }}
                    >
                      <Icon width={16} height={16} />
                    </button>
                  );
                })}
              </div>
            </div>

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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-muted-foreground" aria-hidden="true">
                      <path d="M14.5 1A4.5 4.5 0 0 0 10 5.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-3.5V5.5a3 3 0 1 1 6 0v1a.75.75 0 0 0 1.5 0v-1A4.5 4.5 0 0 0 14.5 1Z" />
                    </svg>
                    {"公開"}
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-muted-foreground" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                    </svg>
                    {"非公開"}
                  </>
                )}
              </span>
            </div>
            {form.isPublic ? (
              <p className="-mt-3 text-xs text-muted-foreground">
                {"公開にすると他のユーザーがこの投稿を参照できます"}
              </p>
            ) : null}
          </div>
        )}
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
            discardIntentionalRef.current = true;
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
