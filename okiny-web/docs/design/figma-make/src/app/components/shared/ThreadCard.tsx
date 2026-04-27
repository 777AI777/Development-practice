import { ActionButtons } from "./ActionButtons";
import type { Screen } from "../types";
import {
  appendTagToComment,
  renderCommentWithHashtags,
} from "./InstagramPostCard";
import { getThreadBadgeColor, getEffectiveBorderColor } from "./theme-colors";
import { Avatar } from "./Avatar";
import { formatSmartDate } from "../formatDate";

export interface ThreadCardData {
  id: string;
  theme: string;
  description?: string;
  tag?: string;
  tags?: string[];
  author: {
    displayName: string;
    displayUserId: string;
    avatarUrl?: string | null;
  };
  answerCount: number;
  /** ISO日付文字列 または 「3日前」などの表示済み文字列 */
  createdAt: string;
  lastAnsweredAt?: string | null;
  isPinned?: boolean;
  borderColor: string;
}

/* --- Icons --- */

function ThreadBadgeIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="#fff"
      fillOpacity={0.25}
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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


function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

/* --- Avatar は shared/Avatar.tsx に集約 --- */

/* --- ThreadCard --- */

export function ThreadCard({
  thread,
  onNavigate,
  onAuthorClick,
  isBookmarked = false,
  onBookmarkClick,
  onShareClick,
  disableNavigate = false,
  showCreatedAt = false,
  showEditButton = false,
  onEditClick,
}: {
  thread: ThreadCardData;
  onNavigate: (screen: Screen) => void;
  onAuthorClick?: () => void;
  isBookmarked?: boolean;
  onBookmarkClick?: () => void;
  onShareClick?: () => void;
  /** trueにすると、カードクリック時の画面遷移を無効にする（詳細画面上部で使うとき等） */
  disableNavigate?: boolean;
  /** trueにすると、ヘッダー行に投稿日時を表示する */
  showCreatedAt?: boolean;
  /** trueにすると、ヘッダー行右端に編集ボタンを表示する */
  showEditButton?: boolean;
  onEditClick?: () => void;
}) {
  const { author, borderColor } = thread;

  const textTitle = "var(--foreground)";
  const textContent = "var(--foreground)";
  const textComment = "var(--foreground)";
  const textPrimary = "var(--foreground)";
  const textSecondary = "var(--muted-foreground)";

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl shadow-sm${disableNavigate ? "" : " cursor-pointer transition-[filter] hover:brightness-95"}`}
      style={{
        backgroundColor: "var(--card)",
        borderWidth: "2px",
        borderStyle: "solid",
        borderColor: getEffectiveBorderColor(borderColor),
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
      onClick={disableNavigate ? undefined : () => onNavigate("thread-detail")}
    >
      {/* アバター + ユーザー名 + スレッドマーク */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${getEffectiveBorderColor(borderColor)}` }}
      >
        {onAuthorClick ? (
          <button
            type="button"
            className="flex items-center gap-3 min-w-0 bg-transparent border-none p-0 cursor-pointer transition hover:opacity-70"
            onClick={(e) => {
              e.stopPropagation();
              onAuthorClick();
            }}
          >
            <Avatar displayName={author.displayName} avatarUrl={author.avatarUrl} />
            <div className="flex flex-col min-w-0">
              <span
                className="text-sm font-semibold truncate text-left"
                style={{ color: textPrimary }}
              >
                {author.displayName}
              </span>
              <span className="text-sm truncate text-left" style={{ color: textSecondary }}>
                @{author.displayUserId}
                {showCreatedAt && ` · ${formatSmartDate(thread.createdAt)}`}
              </span>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar displayName={author.displayName} avatarUrl={author.avatarUrl} />
            <div className="flex flex-col min-w-0">
              <span
                className="text-sm font-semibold truncate"
                style={{ color: textPrimary }}
              >
                {author.displayName}
              </span>
              <span className="text-sm truncate" style={{ color: textSecondary }}>
                @{author.displayUserId}
                {showCreatedAt && ` · ${formatSmartDate(thread.createdAt)}`}
              </span>
            </div>
          </div>
        )}

        {/* 右端: 編集ボタン（showEditButton時）またはスレッドマーク */}
        {showEditButton ? (
          <button
            type="button"
            className="ml-auto flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-70 flex-shrink-0"
            style={{
              color: "var(--muted-foreground)",
              backgroundColor: "var(--muted)",
              border: "none",
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onEditClick?.();
            }}
            aria-label="スレッドを編集"
          >
            <PencilIcon />
            <span>編集</span>
          </button>
        ) : (
          <span
            className="flex items-center gap-1 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{
              backgroundColor: getThreadBadgeColor(borderColor),
              color: "var(--primary-foreground)",
            }}
          >
            <ThreadBadgeIcon />
            スレッド
          </span>
        )}
      </div>

      {/* テーマ（お題タイトル） */}
      <div className="px-4 pt-5 pb-2">
        <h2
          className="text-xl font-semibold leading-snug text-left"
          style={{ color: textTitle }}
        >
          {thread.theme}
        </h2>
      </div>

      {/* コメント（お題の補足文）— タグは本文下に独立行表示・3行truncate */}
      {thread.description && (
        <div className="px-4 pb-2">
          <div
            className="text-sm leading-relaxed text-left"
            style={{
              color: textComment,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {renderCommentWithHashtags(thread.description, 8)}
          </div>
        </div>
      )}

      {/* ハッシュタグ（tags props から表示） */}
      {thread.tags && thread.tags.length > 0 && (
        <div className="px-4 pb-2">
          <p
            className="text-sm text-left"
            style={{ color: "var(--primary)", marginTop: "4px" }}
          >
            {thread.tags.map((t) => `#${t}`).join(" ")}
          </p>
        </div>
      )}

      {/* 回答数 + ブックマーク + 共有 */}
      <div className="flex items-center justify-between px-4 pb-3 mt-auto">
        <span
          className="flex items-center gap-1 text-xs"
          style={{ color: textSecondary }}
        >
          <MessageIcon />
          <span>{thread.answerCount} 回答</span>
        </span>

        <ActionButtons
          isBookmarked={isBookmarked}
          onBookmarkToggle={onBookmarkClick}
          onShare={onShareClick}
        />
      </div>
    </div>
  );
}
