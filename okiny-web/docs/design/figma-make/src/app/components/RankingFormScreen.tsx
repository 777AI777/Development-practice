import { useState, useCallback, useMemo, useRef } from "react";
import { AppHeader } from "./AppHeader";
import type { Screen } from "./types";
import {
  InstagramPostCard,
  type PostCardRanking,
  MARKER_ICONS,
  getMarkerIcon,
} from "./shared/InstagramPostCard";
import { BORDER_COLORS, getAccentColor, getEffectiveBorderColor } from "./shared/theme-colors";

/* --- ChevronDown icon for accordion headers --- */

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

interface RankingFormScreenProps {
  mode: "new" | "edit";
  onNavigate: (screen: Screen) => void;
  onBack?: () => void;
  onSidebarToggle?: () => void;
  onSearchWithQuery?: (query: string) => void;
  onPublish?: (firstItem: string) => void;
}

const COMMENT_MAX_LENGTH = 140;
const MAX_TAGS = 5;

/* --- Mock tag suggestions (15 tags with usageCount) --- */

interface TagSuggestion {
  id: string;
  name: string;
  usageCount: number;
}

const TAG_SUGGESTIONS: TagSuggestion[] = [
  { id: "t1", name: "映画", usageCount: 1842 },
  { id: "t2", name: "音楽", usageCount: 1536 },
  { id: "t3", name: "旅行", usageCount: 1203 },
  { id: "t4", name: "カフェ", usageCount: 987 },
  { id: "t5", name: "化粧品", usageCount: 876 },
  { id: "t6", name: "日用品", usageCount: 654 },
  { id: "t7", name: "アニメ", usageCount: 1421 },
  { id: "t8", name: "ゲーム", usageCount: 1105 },
  { id: "t9", name: "グルメ", usageCount: 932 },
  { id: "t10", name: "読書", usageCount: 814 },
  { id: "t11", name: "ファッション", usageCount: 763 },
  { id: "t12", name: "スポーツ", usageCount: 698 },
  { id: "t13", name: "写真", usageCount: 542 },
  { id: "t14", name: "料理", usageCount: 489 },
  { id: "t15", name: "ペット", usageCount: 423 },
];

/* --- Helper: extract tags from legacy inline comment --- */

function extractTagsFromComment(text: string): { cleanComment: string; tags: string[] } {
  const tags: string[] = [];
  const regex = /#([\p{L}\p{N}_]+)/gu;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (!tags.includes(match[1])) {
      tags.push(match[1]);
    }
  }
  // Remove all #tag occurrences and trim extra whitespace
  const cleanComment = text.replace(/#[\p{L}\p{N}_]+/gu, "").replace(/\s+/g, " ").trim();
  return { cleanComment, tags };
}

const EDIT_INITIAL_RAW = {
  title: "何度でも観たい映画TOP3",
  items: [
    "ショーシャンクの空に",
    "インターステラー",
    "千と千尋の神隠し",
  ],
  comment: "名作は何回観ても新しい発見がある。#映画 好きな人と語りたい #グルメ も絡めて映画鑑賞会したい",
  isPublic: true,
  borderColor: "#FFE5E5",
  markerIcon: "Film",
};

// Decompose legacy inline-tagged comment into separate fields
const EDIT_INITIAL = (() => {
  const { cleanComment, tags } = extractTagsFromComment(EDIT_INITIAL_RAW.comment);
  return {
    ...EDIT_INITIAL_RAW,
    comment: cleanComment,
    tags,
  };
})();

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

function TrendingIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function PlusSmallIcon() {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/* --- XIcon for tag chip removal --- */

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

/* --- Tag Suggest Dropdown --- */

interface TagSuggestDropdownProps {
  query: string;
  onSelect: (tagName: string) => void;
  excludeTags?: string[];
}

function TagSuggestDropdown({ query, onSelect, excludeTags = [] }: TagSuggestDropdownProps) {
  const filtered = useMemo(() => {
    const base = query.length === 0
      ? [...TAG_SUGGESTIONS].sort((a, b) => b.usageCount - a.usageCount).slice(0, 8)
      : TAG_SUGGESTIONS.filter(
          (tag) => tag.name.includes(query) || tag.name.startsWith(query)
        ).sort((a, b) => b.usageCount - a.usageCount);
    return base.filter((tag) => !excludeTags.includes(tag.name));
  }, [query, excludeTags]);

  const showCreateNew = query.length > 0 && !TAG_SUGGESTIONS.some((t) => t.name === query);

  if (filtered.length === 0 && !showCreateNew) return null;

  return (
    <div
      className="absolute left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden"
      style={{ maxHeight: "240px", overflowY: "auto" }}
    >
      {filtered.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => onSelect(tag.name)}
          className="flex w-full items-center justify-between px-3 py-2 text-sm text-left transition hover:bg-muted"
          style={{ color: "var(--foreground)" }}
        >
          <span className="flex items-center gap-2">
            <span className="text-muted-foreground">
              <HashIcon />
            </span>
            <span>{tag.name}</span>
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingIcon />
            <span>{tag.usageCount.toLocaleString()}</span>
          </span>
        </button>
      ))}
      {showCreateNew && (
        <button
          type="button"
          onClick={() => onSelect(query)}
          className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-sm text-left transition hover:bg-muted"
          style={{ color: "var(--primary)" }}
        >
          <PlusSmallIcon />
          <span>「{query}」を新規タグとして作成</span>
        </button>
      )}
    </div>
  );
}

/* --- Main Component --- */

export function RankingFormScreen({ mode, onNavigate, onBack, onSidebarToggle, onSearchWithQuery, onPublish }: RankingFormScreenProps) {
  const isEdit = mode === "edit";

  const [title, setTitle] = useState(isEdit ? EDIT_INITIAL.title : "");
  const [items, setItems] = useState<string[]>(
    isEdit ? [...EDIT_INITIAL.items] : ["", "", ""]
  );
  const [isPublic, setIsPublic] = useState(isEdit ? EDIT_INITIAL.isPublic : true);
  const [comment, setComment] = useState(isEdit ? EDIT_INITIAL.comment : "");
  const [showPreview, setShowPreview] = useState(false);

  // カード外観 state
  const [borderColor, setBorderColor] = useState(isEdit ? EDIT_INITIAL.borderColor : "#FFE5E5");
  const [markerIcon, setMarkerIcon] = useState(isEdit ? EDIT_INITIAL.markerIcon : "Heart");

  // アコーディオン state（初期非表示）
  const [commentOpen, setCommentOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Tag state (独立フィールド)
  const [tags, setTags] = useState<string[]>(isEdit ? [...EDIT_INITIAL.tags] : []);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggest, setShowTagSuggest] = useState(false);
  const [tagTouched, setTagTouched] = useState(false);
  const [draftTitleError, setDraftTitleError] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const hasEnoughForPreview = title.trim().length > 0 && items.some((i) => i.trim().length > 0);
  const hasRequiredTags = tags.length > 0;
  const canPublish = hasEnoughForPreview && hasRequiredTags;

  // プレビュー用: コメント末尾にタグを連結して従来通りの見え方を再現
  const previewComment = useMemo(() => {
    const tagsSuffix = tags.map((t) => `#${t}`).join(" ");
    if (!comment && !tagsSuffix) return undefined;
    if (!comment) return tagsSuffix;
    if (!tagsSuffix) return comment;
    return `${comment} ${tagsSuffix}`;
  }, [comment, tags]);

  // プレビュー用 ranking オブジェクト
  const previewRanking: PostCardRanking = useMemo(
    () => ({
      id: "preview",
      title: title || "（タイトル未入力）",
      items: items.filter((i) => i.trim().length > 0),
      comment: previewComment,
      borderColor,
      markerIcon,
      author: { displayName: "あなた", displayUserId: "you" },
    }),
    [title, items, previewComment, borderColor, markerIcon]
  );

  const handleItemChange = (index: number, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      onNavigate(isEdit ? "ranking-detail" : "rankings");
    }
  };

  // Plain comment change (no inline tag detection)
  const handleCommentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (newValue.length > COMMENT_MAX_LENGTH) return;
      setComment(newValue);
    },
    []
  );

  // --- Tag field handlers ---
  const handleAddTag = useCallback(
    (tagName: string) => {
      const trimmed = tagName.trim();
      if (!trimmed) return;
      if (tags.includes(trimmed)) return;
      if (tags.length >= MAX_TAGS) return;
      setTags((prev) => [...prev, trimmed]);
      setTagInput("");
      setShowTagSuggest(false);
      setTagTouched(true);
      // Refocus input
      requestAnimationFrame(() => tagInputRef.current?.focus());
    },
    [tags]
  );

  const handleRemoveTag = useCallback((tagName: string) => {
    setTags((prev) => prev.filter((t) => t !== tagName));
    setTagTouched(true);
  }, []);

  const handleTagInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTagInput(e.target.value);
      setShowTagSuggest(e.target.value.length >= 0);
    },
    []
  );

  const handleTagInputFocus = useCallback(() => {
    setShowTagSuggest(true);
    setTagTouched(true);
  }, []);

  const handleTagInputBlur = useCallback(() => {
    // Delay to allow click on dropdown items
    setTimeout(() => setShowTagSuggest(false), 200);
  }, []);

  const handleTagInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (tagInput.trim()) {
          handleAddTag(tagInput);
        }
      } else if (e.key === "Escape") {
        setShowTagSuggest(false);
      } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
        // Remove last tag on backspace when input is empty
        setTags((prev) => prev.slice(0, -1));
      }
    },
    [tagInput, tags, handleAddTag]
  );

  const handleSubmit = () => {
    // 公開要件: タイトル + タグ最低1つ + 好きなもの最低1つ
    if (!title.trim()) {
      setDraftTitleError(true);
      return;
    }
    if (!hasRequiredTags) {
      setTagTouched(true);
      return;
    }
    if (!items.some((i) => i.trim().length > 0)) {
      return;
    }
    setDraftTitleError(false);

    // 1番目のアイテムを取得してコールバック経由でバナー情報を渡す
    const firstItem = items.find((i) => i.trim().length > 0) ?? "";
    onPublish?.(firstItem);

    // 即座にランク一覧へ遷移
    onNavigate("rankings");
  };

  const handleDraftSave = () => {
    // 下書き最低要件: タイトルあり
    if (!title.trim()) {
      setDraftTitleError(true);
      return;
    }
    setDraftTitleError(false);
    const payload = {
      title,
      items: items.filter((i) => i.trim().length > 0),
      comment,
      tags,
      isPublic,
      borderColor,
      markerIcon,
    };
    // eslint-disable-next-line no-console
    console.log("[RankingFormScreen] draft payload:", payload);
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <AppHeader onNavigate={onNavigate} onSidebarToggle={onSidebarToggle} />

      <div className="max-w-[480px] mx-auto px-6 py-8">
        {/* Header: back button + action buttons */}
        <div className="flex items-center justify-between mb-10">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="戻る"
          >
            <BackArrowIcon />
          </button>

          <div className="flex items-center gap-2">
            {!isEdit && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate("drafts")}
                  className="shrink-0 rounded-lg border border-border bg-transparent px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
                >
                  下書き一覧
                </button>
                <button
                  type="button"
                  onClick={handleDraftSave}
                  className="shrink-0 rounded-lg border border-border bg-transparent px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
                >
                  下書き保存
                </button>
              </>
            )}
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
              disabled={!canPublish}
              className="shrink-0 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEdit ? "更新する" : "公開する"}
            </button>
          </div>
        </div>

        {!showPreview && (
          <>
            {/* WYSIWYG カード: borderColor と同期した枠で囲む */}
            <div
              className="rounded-2xl border-2 overflow-hidden mb-4"
              style={{
                backgroundColor: "var(--card)",
                borderColor: getEffectiveBorderColor(borderColor),
              }}
            >
              {/* タイトルエリア */}
              <div
                className="px-5 pt-5 pb-4"
                style={{ borderBottom: `1px solid ${getEffectiveBorderColor(borderColor)}` }}
              >
                <input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (e.target.value.trim()) setDraftTitleError(false);
                  }}
                  className="w-full bg-transparent text-xl font-bold outline-none"
                  placeholder="テーマを入力"
                  style={{
                    color: "var(--foreground)",
                  }}
                />
                {draftTitleError && (
                  <p className="mt-1.5 text-xs" style={{ color: "var(--destructive)" }}>
                    タイトルを入力してください
                  </p>
                )}
                {/* テーマサジェスト（タイトルが空のとき） */}
                {title.length === 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {["好きな映画", "週末に行きたい場所", "最近ハマっているもの", "おすすめの本", "元気が出る音楽"].map((theme) => (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => setTitle(theme)}
                        className="px-2.5 py-1 rounded-full text-xs border transition hover:bg-muted"
                        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", backgroundColor: "transparent" }}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* アイテム入力エリア（マーカーアイコン付き） */}
              <div
                className="px-5 py-4 space-y-4"
                style={{ borderBottom: `1px solid ${getEffectiveBorderColor(borderColor)}` }}
              >
                {items.map((item, index) => {
                  const MarkerIconComponent = getMarkerIcon(markerIcon);
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <MarkerIconComponent
                        size={16}
                        style={{ color: getAccentColor(borderColor), flexShrink: 0 }}
                      />
                      <input
                        value={item}
                        onChange={(e) => handleItemChange(index, e.target.value)}
                        placeholder={`好きなもの ${index + 1}`}
                        className="flex-1 bg-transparent text-base outline-none border-none transition-colors"
                        style={{
                          color: "var(--foreground)",
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* コメントアコーディオン（初期非表示） */}
              <div style={{ borderBottom: `1px solid ${getEffectiveBorderColor(borderColor)}` }}>
                <button
                  type="button"
                  onClick={() => setCommentOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between px-5 py-3 text-left transition hover:bg-muted"
                  aria-expanded={commentOpen}
                >
                  <span className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
                    コメント
                    {comment.length > 0 && (
                      <span className="ml-2 text-xs" style={{ color: "var(--primary)" }}>
                        入力済み
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
                      onChange={handleCommentChange}
                      maxLength={COMMENT_MAX_LENGTH}
                      rows={3}
                      placeholder="コメントを入力（140文字以内）"
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
                        className="text-xs shrink-0"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {comment.length}/{COMMENT_MAX_LENGTH}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* タグ入力エリア（独立フィールド） */}
              <div className="px-5 py-4">
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>
                  タグ<span style={{ color: "var(--destructive)" }}> *</span>
                </p>

                {/* 追加済みタグチップ */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: "var(--accent)",
                          color: "var(--primary)",
                        }}
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-0.5 rounded-full p-0.5 transition hover:bg-muted"
                          aria-label={`${tag}を削除`}
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          <XIcon />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* タグ入力 + サジェスト */}
                {tags.length < MAX_TAGS && (
                  <div className="relative">
                    <div
                      className="flex items-center gap-2 rounded-lg border px-3 py-2"
                      style={{
                        borderColor: tagTouched && !hasRequiredTags
                          ? "var(--destructive)"
                          : "var(--border)",
                        backgroundColor: "var(--background)",
                      }}
                    >
                      <span className="text-muted-foreground">
                        <HashIcon />
                      </span>
                      <input
                        ref={tagInputRef}
                        value={tagInput}
                        onChange={handleTagInputChange}
                        onFocus={handleTagInputFocus}
                        onBlur={handleTagInputBlur}
                        onKeyDown={handleTagInputKeyDown}
                        placeholder="タグを検索・追加"
                        className="flex-1 bg-transparent text-sm outline-none"
                        style={{ color: "var(--foreground)" }}
                      />
                      {tagInput.trim() && (
                        <button
                          type="button"
                          onClick={() => handleAddTag(tagInput)}
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
                    {showTagSuggest && (
                      <TagSuggestDropdown
                        query={tagInput}
                        onSelect={handleAddTag}
                        excludeTags={tags}
                      />
                    )}
                  </div>
                )}

                {/* バリデーションエラー */}
                {tagTouched && !hasRequiredTags && (
                  <p className="mt-1.5 text-xs" style={{ color: "var(--destructive)" }}>
                    公開するにはタグを最低1つ追加してください
                  </p>
                )}

                <p className="mt-1.5 text-xs text-muted-foreground">
                  {tags.length}/{MAX_TAGS}個（公開時は最低1つ必須）
                </p>
              </div>
            </div>

            {/* その他の設定アコーディオン（枠線色・アイコン・公開設定） */}
            <div
              className="rounded-2xl border mb-8 overflow-hidden"
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
                  その他の設定
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
                      枠線の色
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      {BORDER_COLORS.map((color) => {
                        const isSelected = borderColor === color.value;
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
                                ? "3px solid var(--foreground)"
                                : "2px solid var(--border)",
                              boxShadow: isSelected
                                ? "0 0 0 2px var(--background), 0 0 0 4px var(--foreground)"
                                : "none",
                              outline: "none",
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* マーカーアイコンセレクター */}
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>
                      アイコン
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      {MARKER_ICONS.map((icon) => {
                        const isSelected = markerIcon === icon.name;
                        const Icon = getMarkerIcon(icon.name);
                        return (
                          <button
                            key={icon.name}
                            type="button"
                            onClick={() => setMarkerIcon(icon.name)}
                            aria-label={icon.label}
                            title={icon.label}
                            className="flex-shrink-0 flex items-center justify-center rounded-lg transition-colors"
                            style={{
                              width: "36px",
                              height: "36px",
                              backgroundColor: isSelected ? "var(--accent)" : "var(--muted)",
                              border: isSelected
                                ? `2px solid ${getAccentColor(borderColor)}`
                                : "2px solid transparent",
                              color: isSelected ? getAccentColor(borderColor) : "var(--muted-foreground)",
                              outline: "none",
                            }}
                          >
                            <Icon size={16} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 公開設定トグル */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPublic((prev) => !prev)}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                        isPublic ? "bg-primary" : "bg-muted"
                      }`}
                      role="switch"
                      aria-checked={isPublic}
                      aria-label={isPublic ? "公開" : "非公開"}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full shadow transition-transform ${
                          isPublic ? "translate-x-6" : "translate-x-1"
                        }`}
                        style={{ backgroundColor: "var(--background)" }}
                      />
                    </button>
                    <span className="flex items-center gap-1.5 text-sm text-foreground">
                      {isPublic ? (
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
                </div>
              )}
            </div>

            {/* Cancel button (new mode only) */}
            {!isEdit && (
              <button
                type="button"
                onClick={handleBack}
                className="w-full rounded-lg border border-border bg-transparent py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                キャンセル
              </button>
            )}
          </>
        )}

        {showPreview && (
          <div className="mt-6" style={{ whiteSpace: "pre-wrap" }}>
            <InstagramPostCard variant="list" ranking={previewRanking} />
            <p className="text-xs mt-3 text-center" style={{ color: "var(--muted-foreground)" }}>
              これは投稿後の表示イメージです
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
