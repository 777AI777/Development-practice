import { useState } from "react";
import { AppHeader } from "./AppHeader";
import type { Screen } from "./types";

type TabType = "muted" | "blocked" | "words";

interface SettingsScreenProps {
  onNavigate: (screen: Screen) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  initialView?: string;
}

interface MockUser {
  id: string;
  displayName: string;
  displayUserId: string;
  avatarUrl: string | null;
}

interface MockMutedWord {
  id: string;
  word: string;
}

const SETTINGS_ITEMS = [
  {
    label: "ミュートしたユーザー",
    destructive: false,
    tab: "muted" as TabType,
  },
  {
    label: "ブロックしたユーザー",
    destructive: false,
    tab: "blocked" as TabType,
  },
  {
    label: "プレミアムプラン",
    destructive: false,
    screen: "premium-plan" as Screen,
  },
  {
    label: "ログアウト",
    destructive: true,
    screen: "logout-confirm" as Screen,
  },
] as const;

const MOCK_MUTED_USERS: MockUser[] = [
  {
    id: "mu1",
    displayName: "スパム太郎",
    displayUserId: "spam_taro",
    avatarUrl: null,
  },
  {
    id: "mu2",
    displayName: "迷惑ユーザー",
    displayUserId: "meiwaku_user",
    avatarUrl: null,
  },
];

const MOCK_BLOCKED_USERS: MockUser[] = [
  {
    id: "bu1",
    displayName: "悪質ユーザー",
    displayUserId: "bad_user",
    avatarUrl: null,
  },
];

const MOCK_MUTED_WORDS: MockMutedWord[] = [
  { id: "mw1", word: "スパム" },
  { id: "mw2", word: "宣伝" },
  { id: "mw3", word: "フォロー返し" },
];

function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground"
    >
      <path
        d="M6 12L10 8L6 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserInitial({ name }: { name: string }) {
  const initial = name.charAt(0);
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
      {initial}
    </div>
  );
}

/* ---------- 設定メニュー一覧ビュー ---------- */

function SettingsMenuView({
  onNavigate,
  onOpenMutedBlocked,
  theme,
  onToggleTheme,
}: {
  onNavigate: (screen: Screen) => void;
  onOpenMutedBlocked: (tab: TabType) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  return (
    <>
      <h1 className="mb-6 text-lg font-bold text-foreground">設定</h1>

      {/* テーマ設定 */}
      <div className="mb-4 rounded-xl border border-border bg-card px-4 py-3">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          テーマ設定
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">ダークモード</span>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-checked={theme === "dark"}
            role="switch"
            aria-label="ダークモード切り替え"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              theme === "dark" ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full transition-transform ${
                theme === "dark"
                  ? "translate-x-6 bg-white"
                  : "translate-x-1 bg-muted-foreground"
              }`}
            />
          </button>
        </div>
      </div>

      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {SETTINGS_ITEMS.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              onClick={() => {
                if ("tab" in item) {
                  onOpenMutedBlocked(item.tab);
                } else if ("screen" in item) {
                  onNavigate(item.screen);
                }
              }}
              className={`flex w-full items-center justify-between px-4 py-3.5 transition hover:bg-muted bg-transparent border-none cursor-pointer text-left ${
                item.destructive
                  ? "text-destructive"
                  : "text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                {item.label === "プレミアムプラン" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                )}
                {item.label}
              </span>
              <ChevronRight />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ---------- ミュート・ブロック管理ビュー ---------- */

function MutedBlockedView({
  initialTab,
  onBack,
}: {
  initialTab: TabType;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [mutedUsers, setMutedUsers] = useState(MOCK_MUTED_USERS);
  const [blockedUsers, setBlockedUsers] = useState(MOCK_BLOCKED_USERS);
  const [mutedWords, setMutedWords] = useState(MOCK_MUTED_WORDS);
  const [wordInput, setWordInput] = useState("");

  const handleUnmute = (userId: string) => {
    setMutedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleUnblock = (userId: string) => {
    setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleAddWord = () => {
    const trimmed = wordInput.trim();
    if (trimmed.length === 0 || trimmed.length > 50) return;
    if (mutedWords.some((w) => w.word === trimmed)) return;
    setMutedWords((prev) => [
      { id: `mw-${Date.now()}`, word: trimmed },
      ...prev,
    ]);
    setWordInput("");
  };

  const handleRemoveWord = (wordId: string) => {
    setMutedWords((prev) => prev.filter((w) => w.id !== wordId));
  };

  const mutedCount = mutedUsers.length;
  const blockedCount = blockedUsers.length;
  const wordsCount = mutedWords.length;

  return (
    <>
      {/* 戻るボタン */}
      <div className="mb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer bg-transparent border-none"
        >
          <span aria-hidden="true">{"\u2190"}</span>
          <span>設定</span>
        </button>
      </div>

      {/* タブバー */}
      <div className="flex border-b border-border" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "muted"}
          onClick={() => setActiveTab("muted")}
          className={`flex-1 py-3 text-center text-sm font-semibold transition ${
            activeTab === "muted"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {`ミュート中 ${mutedCount}`}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "blocked"}
          onClick={() => setActiveTab("blocked")}
          className={`flex-1 py-3 text-center text-sm font-semibold transition ${
            activeTab === "blocked"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {`ブロック中 ${blockedCount}`}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "words"}
          onClick={() => setActiveTab("words")}
          className={`flex-1 py-3 text-center text-sm font-semibold transition ${
            activeTab === "words"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {`ミュートワード ${wordsCount}`}
        </button>
      </div>

      {/* ミュートタブ */}
      {activeTab === "muted" && (
        <div role="tabpanel">
          {mutedUsers.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                ミュートしたユーザーはいません
              </p>
            </div>
          ) : (
            <div>
              {mutedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 border-b border-border px-4 py-3 transition hover:bg-muted/50"
                >
                  <UserInitial name={user.displayName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{user.displayUserId}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnmute(user.id)}
                    className="shrink-0 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted cursor-pointer"
                  >
                    解除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ブロックタブ */}
      {activeTab === "blocked" && (
        <div role="tabpanel">
          {blockedUsers.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                ブロックしたユーザーはいません
              </p>
            </div>
          ) : (
            <div>
              {blockedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 border-b border-border px-4 py-3 transition hover:bg-muted/50"
                >
                  <UserInitial name={user.displayName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{user.displayUserId}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnblock(user.id)}
                    className="shrink-0 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted cursor-pointer"
                  >
                    解除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ミュートワードタブ */}
      {activeTab === "words" && (
        <div role="tabpanel">
          {/* 入力フォーム */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddWord();
            }}
            className="flex items-center gap-2 border-b border-border px-4 py-3"
          >
            <input
              type="text"
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value)}
              placeholder="ミュートするワードを入力"
              maxLength={50}
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={wordInput.trim().length === 0}
              className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 cursor-pointer border-none"
            >
              追加
            </button>
          </form>

          {mutedWords.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                ミュートワードはありません
              </p>
            </div>
          ) : (
            <div>
              {mutedWords.map((word) => (
                <div
                  key={word.id}
                  className="flex items-center justify-between border-b border-border px-4 py-3"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {word.word}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveWord(word.id)}
                    className="ml-3 shrink-0 text-muted-foreground transition hover:text-foreground cursor-pointer bg-transparent border-none"
                    aria-label={`${word.word}を削除`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ---------- メインコンポーネント ---------- */

type SettingsView = "menu" | "muted-blocked";

export function SettingsScreen({ onNavigate, theme, onToggleTheme, initialView }: SettingsScreenProps) {
  const [view, setView] = useState<SettingsView>((initialView === "muted-blocked" ? "muted-blocked" : "menu") as SettingsView);
  const [mutedBlockedTab, setMutedBlockedTab] = useState<TabType>("muted");

  const handleOpenMutedBlocked = (tab: TabType) => {
    setMutedBlockedTab(tab);
    setView("muted-blocked");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onNavigate={onNavigate} />

      <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
        {view === "menu" && (
          <SettingsMenuView
            onNavigate={onNavigate}
            onOpenMutedBlocked={handleOpenMutedBlocked}
            theme={theme}
            onToggleTheme={onToggleTheme}
          />
        )}

        {view === "muted-blocked" && (
          <MutedBlockedView
            initialTab={mutedBlockedTab}
            onBack={() => setView("menu")}
          />
        )}
      </div>
    </div>
  );
}
