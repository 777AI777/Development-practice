import { useState, useCallback } from "react";
import type { Screen } from "./types";

interface ProfileEditScreenProps {
  onNavigate: (screen: Screen) => void;
  onBack?: () => void;
}

const MOCK_PROFILE = {
  displayName: "Taro Yamada",
  displayUserId: "taro_y",
  avatarUrl: null as string | null,
  introduction: "映画とカフェが好きです。週末はいつも映画館に行ってます。",
  links: [
    { url: "https://x.com/taro_y" },
    { url: "https://github.com/taro-yamada" },
  ],
};

const MAX_INTRODUCTION_LENGTH = 200;
const MAX_DISPLAY_NAME_LENGTH = 30;
const MIN_DISPLAY_USER_ID_LENGTH = 3;
const MAX_DISPLAY_USER_ID_LENGTH = 20;
const DISPLAY_USER_ID_PATTERN = /^[a-z0-9_]+$/;
const MAX_LINKS = 5;

/**
 * displayUserId のバリデーション。
 * 重複チェックはモック上ではスキップ — 実装時はサーバー検証が必要。
 */
function validateDisplayUserId(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "ユーザーIDは必須です";
  }
  if (
    trimmed.length < MIN_DISPLAY_USER_ID_LENGTH ||
    trimmed.length > MAX_DISPLAY_USER_ID_LENGTH
  ) {
    return `${MIN_DISPLAY_USER_ID_LENGTH}〜${MAX_DISPLAY_USER_ID_LENGTH}文字で入力してください`;
  }
  if (!DISPLAY_USER_ID_PATTERN.test(trimmed)) {
    return "英小文字・数字・アンダースコアのみ使用可";
  }
  return null;
}

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

function CameraIcon() {
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
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function getUserInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function ProfileEditScreen({ onNavigate, onBack }: ProfileEditScreenProps) {
  const [editName, setEditName] = useState(MOCK_PROFILE.displayName);
  const [editUserId, setEditUserId] = useState(MOCK_PROFILE.displayUserId);
  const [editIntroduction, setEditIntroduction] = useState(
    MOCK_PROFILE.introduction,
  );
  const [editLinks, setEditLinks] = useState<Array<{ url: string }>>(
    MOCK_PROFILE.links.map((l) => ({ url: l.url })),
  );
  const [saving, setSaving] = useState(false);

  const hasChanges =
    editName.trim() !== MOCK_PROFILE.displayName ||
    editUserId.trim() !== MOCK_PROFILE.displayUserId ||
    editIntroduction.trim() !== MOCK_PROFILE.introduction ||
    JSON.stringify(editLinks.filter((l) => l.url.trim())) !==
      JSON.stringify(MOCK_PROFILE.links);

  const userIdError = validateDisplayUserId(editUserId);

  const isValid =
    editName.trim().length > 0 &&
    userIdError === null &&
    editIntroduction.length <= MAX_INTRODUCTION_LENGTH;

  const canSave = hasChanges && isValid && !saving;

  const handleGoBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      onNavigate("user-profile");
    }
  }, [onBack, onNavigate]);

  const handleSave = useCallback(() => {
    if (!canSave) return;
    setSaving(true);
    // Mock save - just navigate back
    setTimeout(() => {
      setSaving(false);
      handleGoBack();
    }, 500);
  }, [canSave, handleGoBack]);

  const handleAddLink = useCallback(() => {
    if (editLinks.length < MAX_LINKS) {
      setEditLinks([...editLinks, { url: "" }]);
    }
  }, [editLinks]);

  const handleRemoveLink = useCallback(
    (index: number) => {
      setEditLinks(editLinks.filter((_, i) => i !== index));
    },
    [editLinks],
  );

  const handleLinkChange = useCallback(
    (index: number, value: string) => {
      setEditLinks(
        editLinks.map((l, i) => (i === index ? { url: value } : l)),
      );
    },
    [editLinks],
  );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-30 flex h-14 items-center justify-between px-4"
        style={{
          backgroundColor: "var(--background)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          type="button"
          onClick={handleGoBack}
          className="inline-flex items-center rounded-lg p-1.5 transition hover:bg-muted bg-transparent border-none cursor-pointer"
          style={{ color: "var(--muted-foreground)" }}
          aria-label="戻る"
        >
          <BackArrowIcon />
        </button>
        <h1
          className="text-base font-bold"
          style={{ color: "var(--foreground)" }}
        >
          プロフィール編集
        </h1>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="rounded-md px-3 py-1.5 text-sm font-semibold transition border-none cursor-pointer"
          style={{
            backgroundColor: canSave ? "var(--primary)" : "var(--muted)",
            color: canSave
              ? "var(--primary-foreground)"
              : "var(--muted-foreground)",
            opacity: canSave ? 1 : 0.6,
          }}
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>

      <div className="max-w-[480px] mx-auto px-4 py-6 space-y-6">
        {/* Avatar section */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {MOCK_PROFILE.avatarUrl ? (
              <img
                src={MOCK_PROFILE.avatarUrl}
                alt={MOCK_PROFILE.displayName}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
              >
                {getUserInitial(editName || MOCK_PROFILE.displayName)}
              </div>
            )}
            <button
              type="button"
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full shadow-sm border-none cursor-pointer"
              style={{
                backgroundColor: "var(--card)",
                color: "var(--muted-foreground)",
                border: "1px solid var(--border)",
              }}
              aria-label="アバター画像を変更"
            >
              <CameraIcon />
            </button>
          </div>
          <p
            className="text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            タップして画像を変更
          </p>
        </div>

        {/* Display name */}
        <div className="space-y-1.5">
          <label
            className="text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            表示名
          </label>
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            className="w-full rounded-lg px-3 py-2.5 text-sm transition focus:outline-none"
            style={{
              backgroundColor: "var(--card)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
            placeholder="表示名を入力"
          />
          <p
            className="text-right text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            {editName.length}/{MAX_DISPLAY_NAME_LENGTH}
          </p>
        </div>

        {/* User ID */}
        <div className="space-y-1.5">
          <label
            className="text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            ユーザーID
          </label>
          <div
            className="flex items-center rounded-lg px-3 py-2.5"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              className="text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              @
            </span>
            <input
              value={editUserId}
              onChange={(e) => setEditUserId(e.target.value)}
              maxLength={MAX_DISPLAY_USER_ID_LENGTH}
              className="flex-1 bg-transparent text-sm focus:outline-none"
              style={{ color: "var(--foreground)" }}
              placeholder="user_id"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          {userIdError ? (
            <p
              className="text-xs"
              style={{ color: "var(--destructive)" }}
            >
              {userIdError}
            </p>
          ) : (
            <p
              className="text-xs"
              style={{ color: "var(--muted-foreground)" }}
            >
              英小文字・数字・アンダースコア（3〜20文字）
            </p>
          )}
        </div>

        {/* Introduction */}
        <div className="space-y-1.5">
          <label
            className="text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            自己紹介
          </label>
          <textarea
            value={editIntroduction}
            onChange={(e) => setEditIntroduction(e.target.value)}
            maxLength={MAX_INTRODUCTION_LENGTH}
            rows={4}
            className="w-full rounded-lg px-3 py-2.5 text-sm transition resize-none focus:outline-none"
            style={{
              backgroundColor: "var(--card)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
            placeholder="自己紹介を入力"
          />
          <p
            className="text-right text-xs"
            style={{
              color:
                editIntroduction.length > MAX_INTRODUCTION_LENGTH
                  ? "var(--destructive)"
                  : "var(--muted-foreground)",
            }}
          >
            {editIntroduction.length}/{MAX_INTRODUCTION_LENGTH}
          </p>
        </div>

        {/* Links */}
        <div className="space-y-1.5">
          <label
            className="text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            外部リンク（最大{MAX_LINKS}件）
          </label>
          <div className="space-y-2">
            {editLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={link.url}
                  onChange={(e) => handleLinkChange(index, e.target.value)}
                  className="flex-1 rounded-lg px-3 py-2.5 text-sm transition focus:outline-none"
                  style={{
                    backgroundColor: "var(--card)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                  }}
                  placeholder="https://example.com"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  className="shrink-0 rounded-md p-2 transition hover:bg-muted bg-transparent border-none cursor-pointer"
                  style={{ color: "var(--muted-foreground)" }}
                  aria-label="リンクを削除"
                >
                  <CloseIcon />
                </button>
              </div>
            ))}
            {editLinks.length < MAX_LINKS && (
              <button
                type="button"
                onClick={handleAddLink}
                className="text-sm transition hover:opacity-70 bg-transparent border-none cursor-pointer"
                style={{ color: "var(--primary)" }}
              >
                + リンクを追加
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
