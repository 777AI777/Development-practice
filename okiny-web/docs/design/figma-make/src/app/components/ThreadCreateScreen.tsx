import { useState } from "react";
import { AppHeader } from "./AppHeader";
import type { Screen } from "./types";
import { BORDER_COLORS, getAccentColor, getEffectiveBorderColor } from "./shared/theme-colors";
import { highlightHashtags } from "./shared/InstagramPostCard";

export interface ThreadInitialData {
  theme: string;
  description: string;
  tags: string[];
  borderColor: string;
}

interface Props {
  onNavigate: (screen: Screen) => void;
  onBack?: () => void;
  onSidebarToggle?: () => void;
  onSubmit?: () => void;
  mode?: "create" | "edit";
  initialData?: ThreadInitialData;
}

const THEME_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 200;
const TAG_MAX = 5;

const PREVIEW_BG = "var(--card)";

/* --- Icons (SVG inline) --- */

function BackArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
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

function HashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/* --- Preview card (ThreadListScreen の ThreadCard に準拠) --- */

function ThreadBadgeIcon({ color }: { color: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function PreviewCard({
  theme,
  description,
  tags,
  borderColor,
}: {
  theme: string;
  description: string;
  tags: string[];
  borderColor: string;
}) {
  const textPrimary = "var(--foreground)";
  const textSecondary = "var(--muted-foreground)";

  const displayTheme = theme.trim() || "（テーマ未入力）";
  const displayDescription = description.trim();

  /* 本文末尾にハッシュタグをインライン表示するためのテキストを組み立て */
  const tagSuffix = tags
    .filter((t) => !displayDescription.includes(`#${t}`))
    .map((t) => `#${t}`)
    .join(" ");
  const previewText = [displayDescription, tagSuffix].filter(Boolean).join("\n");

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl shadow-sm"
      style={{
        backgroundColor: PREVIEW_BG,
        borderWidth: "2px",
        borderStyle: "solid",
        borderColor: getEffectiveBorderColor(borderColor),
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* Author row + スレッドバッジ */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${getEffectiveBorderColor(borderColor)}` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0"
            style={{
              backgroundColor: "var(--muted)",
              color: "var(--muted-foreground)",
            }}
          >
            あ
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold truncate" style={{ color: textPrimary }}>
              あなた
            </span>
            <span className="text-xs truncate" style={{ color: textSecondary }}>
              @you
            </span>
          </div>
        </div>

        {/* スレッドバッジ */}
        <span
          className="flex items-center gap-1 flex-shrink-0 rounded-full px-2 py-0.5 text-xs"
          style={{
            backgroundColor: `${borderColor}18`,
            color: getAccentColor(borderColor),
            border: `1px solid ${borderColor}40`,
          }}
        >
          <ThreadBadgeIcon color={getAccentColor(borderColor)} />
          スレッド
        </span>
      </div>

      <div className="p-4">
        {/* Theme title */}
        <h3
          className="text-lg font-bold mb-2 leading-snug"
          style={{ color: textPrimary }}
        >
          {displayTheme}
        </h3>

        {/* Description（末尾ハッシュタグをインライン表示・改行反映） */}
        {previewText && (
          <p
            className="text-[14px] leading-relaxed mb-3 whitespace-pre-line"
            style={{ color: textSecondary }}
          >
            {highlightHashtags(previewText)}
          </p>
        )}

        {/* Stats row (公開前なので「--」表示) */}
        <div
          className="flex items-center gap-3 pt-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span className="flex items-center gap-1 text-xs" style={{ color: textSecondary }}>
            <MessageIcon />
            <span>-- 件の回答</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* --- Main screen --- */

export function ThreadCreateScreen({ onNavigate, onBack, onSidebarToggle, onSubmit, mode = "create", initialData }: Props) {
  const isEdit = mode === "edit";
  const [theme, setTheme] = useState(initialData?.theme ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [tagError, setTagError] = useState("");
  const [tagTouched, setTagTouched] = useState(false);
  const [borderColor, setBorderColor] = useState(initialData?.borderColor ?? "#FFE5E5");
  const [showPreview, setShowPreview] = useState(false);

  const isOverThemeLimit = theme.length > THEME_MAX_LENGTH;
  const isOverDescLimit = description.length > DESCRIPTION_MAX_LENGTH;
  const hasTags = tags.length > 0;
  const canSubmit =
    theme.trim().length > 0 && !isOverThemeLimit && !isOverDescLimit && hasTags;
  const hasEnoughForPreview = theme.trim().length > 0;

  function addTag(raw: string) {
    const value = raw.trim().replace(/^#/, "");
    if (!value) return;
    if (tags.includes(value)) {
      setTagError("同じタグが既に追加されています");
      return;
    }
    if (tags.length >= TAG_MAX) {
      setTagError(`タグは最大${TAG_MAX}個までです`);
      return;
    }
    setTags([...tags, value]);
    setTagInput("");
    setTagError("");
    setTagTouched(true);
  }

  function removeTag(index: number) {
    setTags(tags.filter((_, i) => i !== index));
    setTagError("");
    setTagTouched(true);
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
    /* Backspaceで最後のタグを削除 */
    if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      onNavigate("thread-list");
    }
  };

  const handleSubmit = () => {
    if (!theme.trim()) return;
    if (!hasTags) {
      setTagTouched(true);
      return;
    }
    if (onSubmit) {
      onSubmit();
    } else {
      onNavigate(isEdit ? "thread-detail" : "thread-list");
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <AppHeader onNavigate={onNavigate} onSidebarToggle={onSidebarToggle} />

      <div className="max-w-[480px] mx-auto px-6 py-8">
        {/* Header: back button + title + action buttons */}
        <div className="relative flex items-center justify-between mb-10">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="戻る"
          >
            <BackArrowIcon />
          </button>

          <h1
            className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {isEdit ? "スレッド編集" : "スレッド作成"}
          </h1>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview((prev) => !prev)}
              disabled={!hasEnoughForPreview}
              className="shrink-0 rounded-lg border border-border bg-transparent px-3 py-1.5 text-xs font-semibold transition hover:bg-muted"
              style={{
                color: hasEnoughForPreview ? "var(--foreground)" : "var(--muted-foreground)",
                opacity: hasEnoughForPreview ? 1 : 0.5,
                cursor: hasEnoughForPreview ? "pointer" : "default",
              }}
            >
              {showPreview ? "編集に戻る" : "プレビュー"}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="shrink-0 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEdit ? "更新する" : "投稿する"}
            </button>
          </div>
        </div>

        {!showPreview && (
          <>
            {/* Toolbar: 枠線色セレクター（カード外上部） */}
            <div className="mb-5">
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>
                枠線の色
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {BORDER_COLORS.map((color) => {
                  const isSelected = borderColor === color.value;
                  const ringColor = "var(--foreground)";
                  return (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setBorderColor(color.value)}
                      aria-label={color.label}
                      title={color.label}
                      className="flex-shrink-0 rounded-full transition-transform hover:scale-110"
                      style={{
                        width: "32px",
                        height: "32px",
                        backgroundColor: getEffectiveBorderColor(color.value),
                        border: isSelected
                          ? `3px solid ${ringColor}`
                          : "2px solid rgba(0,0,0,0.12)",
                        boxShadow: isSelected
                          ? `0 0 0 2px var(--background), 0 0 0 4px ${ringColor}`
                          : "none",
                        outline: "none",
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* WYSIWYG カード: borderColor と同期した枠で囲む */}
            <div
              className="rounded-2xl border-2 overflow-hidden mb-8"
              style={{
                backgroundColor: "var(--card)",
                borderColor: getEffectiveBorderColor(borderColor),
              }}
            >
              {/* テーマ入力エリア */}
              <div
                className="px-5 pt-5 pb-4"
                style={{ borderBottom: `1px solid ${getEffectiveBorderColor(borderColor)}` }}
              >
                <input
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  maxLength={THEME_MAX_LENGTH + 10}
                  className="w-full bg-transparent text-xl font-bold outline-none"
                  placeholder="みんなに聞いてみたいテーマ"
                  style={{
                    color: "var(--foreground)",
                  }}
                />
                <div className="flex items-center justify-end mt-1.5">
                  <span
                    className="text-xs"
                    style={{ color: isOverThemeLimit ? "var(--destructive)" : "var(--muted-foreground)" }}
                  >
                    {theme.length}/{THEME_MAX_LENGTH}
                  </span>
                </div>
              </div>

              {/* 説明テキストエリア */}
              <div
                className="px-5 py-4"
                style={{ borderBottom: `1px solid ${getEffectiveBorderColor(borderColor)}` }}
              >
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  rows={4}
                  placeholder="回答のヒントや気持ちを添えて…（任意）"
                  className="w-full resize-none bg-transparent text-sm outline-none"
                  style={{
                    color: "var(--foreground)",
                    caretColor: "var(--foreground)",
                    paddingBottom: "6px",
                    lineHeight: "1.5",
                    fontFamily: "'Noto Sans JP', sans-serif",
                    whiteSpace: "pre-wrap",
                  }}
                />
                <div className="flex items-center justify-end mt-1">
                  <span
                    className="text-xs"
                    style={{ color: isOverDescLimit ? "var(--destructive)" : "var(--muted-foreground)" }}
                  >
                    {description.length}/{DESCRIPTION_MAX_LENGTH}
                  </span>
                </div>
              </div>

              {/* タグ入力エリア */}
              <div className="px-5 py-4">
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>
                  タグ<span style={{ color: "var(--destructive)" }}> *</span>
                </p>

                {/* 追加済みタグチップ */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map((t, i) => (
                      <span
                        key={`${t}-${i}`}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: "var(--accent)",
                          color: "var(--primary)",
                        }}
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => removeTag(i)}
                          className="ml-0.5 rounded-full p-0.5 transition hover:bg-muted"
                          aria-label={`${t}を削除`}
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          <XIcon />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* タグ入力フィールド */}
                {tags.length < TAG_MAX && (
                  <div
                    className="flex items-center gap-2 rounded-lg border px-3 py-2"
                    style={{
                      borderColor: tagTouched && !hasTags
                        ? "var(--destructive)"
                        : "var(--border)",
                      backgroundColor: "var(--background)",
                    }}
                  >
                    <span className="text-muted-foreground">
                      <HashIcon />
                    </span>
                    <input
                      value={tagInput}
                      onChange={(e) => {
                        setTagInput(e.target.value);
                        setTagError("");
                      }}
                      onFocus={() => setTagTouched(true)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="タグを検索・追加"
                      className="flex-1 bg-transparent text-sm outline-none"
                      style={{ color: "var(--foreground)" }}
                    />
                    {tagInput.trim() && (
                      <button
                        type="button"
                        onClick={() => addTag(tagInput)}
                        className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold transition hover:opacity-80"
                        style={{
                          backgroundColor: "var(--primary)",
                          color: "var(--primary-foreground)",
                        }}
                      >
                        追加
                      </button>
                    )}
                  </div>
                )}

                {/* バリデーションエラー */}
                {tagTouched && !hasTags && (
                  <p className="mt-1.5 text-xs" style={{ color: "var(--destructive)" }}>
                    {tagError || "公開するにはタグを最低1つ追加してください"}
                  </p>
                )}
                {tagError && hasTags && (
                  <p className="mt-1.5 text-xs" style={{ color: "var(--destructive)" }}>
                    {tagError}
                  </p>
                )}

                <p className="mt-1.5 text-xs text-muted-foreground">
                  {tags.length}/{TAG_MAX}個（公開時は最低1つ必須）
                </p>
              </div>
            </div>

            {/* Cancel button */}
            <button
              type="button"
              onClick={handleBack}
              className="w-full rounded-lg border border-border bg-transparent py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              キャンセル
            </button>

            {/* Note */}
            <p
              className="text-xs mt-4 text-center"
              style={{ color: "var(--muted-foreground)" }}
            >
              誰でもこのスレッドに回答できます
            </p>
          </>
        )}

        {showPreview && (
          <div className="mt-6" style={{ whiteSpace: "pre-wrap" }}>
            <PreviewCard theme={theme} description={description} tags={tags} borderColor={borderColor} />
            <p className="text-xs mt-3 text-center" style={{ color: "var(--muted-foreground)" }}>
              これは投稿後の表示イメージです
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
