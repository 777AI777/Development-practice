import { AppHeader } from "./AppHeader";
import { InstagramPostCard } from "./shared/InstagramPostCard";
import type { PostCardRanking } from "./shared/InstagramPostCard";
import type { Screen } from "./types";
import { Upload, Trash2 } from "lucide-react";

interface DraftsScreenProps {
  onNavigate: (screen: Screen) => void;
  onSidebarToggle?: () => void;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MockDraft = {
  id: string;
  title: string;
  tag?: string;
  items: string[];
  comment?: string;
  borderColor: string;
  markerIcon: string;
  updatedAt: string;
  author: { displayName: string; displayUserId?: string; avatarUrl?: string };
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const AVATAR_A = "https://picsum.photos/seed/okiny_me_a/100/100";
const AVATAR_B = "https://picsum.photos/seed/okiny_me_b/100/100";

const MOCK_DRAFTS: MockDraft[] = [
  {
    id: "d1",
    title: "旅行スポットベスト3",
    tag: "旅行",
    items: ["京都", "北海道", "沖縄"],
    comment:
      "どこも何度でも行きたくなる場所。京都は四季折々の表情が最高で、北海道は夏のラベンダー畑が忘れられない。沖縄の海は言わずもがな。\n#旅行 #国内旅行",
    borderColor: "#FFE5E5",
    markerIcon: "Sun",
    updatedAt: "3/10",
    author: { displayName: "You", displayUserId: "me", avatarUrl: AVATAR_A },
  },
  {
    id: "d2",
    title: "おすすめラーメン3選",
    tag: "グルメ",
    items: ["一蘭", "天下一品"],
    comment:
      "3店目がまだ決まらない。一蘭の替え玉は外せないし、天一のこってりは定期的に食べたくなる。もう1軒は地元の隠れた名店を入れたい。\n#グルメ #ラーメン #下書き途中",
    borderColor: "#DFECF8",
    markerIcon: "Coffee",
    updatedAt: "3/8",
    author: { displayName: "You", displayUserId: "me", avatarUrl: AVATAR_B },
  },
  {
    id: "d3",
    title: "",
    tag: "映画",
    items: ["ショーシャンクの空に"],
    comment:
      "名作を3つ選びたいけど、まだ1本しか決まってない。何度観ても泣ける映画ってそんなに多くない。\n#映画",
    borderColor: "#F8EFD5",
    markerIcon: "Film",
    updatedAt: "3/5",
    author: { displayName: "You", displayUserId: "me", avatarUrl: AVATAR_A },
  },
  {
    id: "d4",
    title: "好きなアーティスト",
    tag: "音楽",
    items: [],
    comment:
      "好きすぎて逆に選べない状態。ジャンルも邦楽・洋楽・インストと幅広いから絞るのが難しい。\n#音楽 #アーティスト",
    borderColor: "#DCEDE2",
    markerIcon: "Music4",
    updatedAt: "3/3",
    author: { displayName: "You", displayUserId: "me", avatarUrl: AVATAR_A },
  },
  {
    id: "d5",
    title: "最近ハマってるコスメ",
    tag: "化粧品",
    items: ["NARS リップ", "SUQQU アイシャドウ", "ADDICTION チーク"],
    comment:
      "全部リピ確定のお気に入り。NARSのリップは発色が抜群で、SUQQUのアイシャドウは粉質が別格。ADDICTIONのチークはナチュラルに仕上がるのが好き。\n#化粧品 #コスメ #リピ買い",
    borderColor: "#E8DFF3",
    markerIcon: "Star",
    updatedAt: "3/1",
    author: { displayName: "You", displayUserId: "me", avatarUrl: AVATAR_B },
  },
];

const MAX_DRAFTS_PER_USER = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPostCardRanking(draft: MockDraft): PostCardRanking {
  return {
    id: draft.id,
    title: draft.title || "（無題）",
    tag: draft.tag,
    items: draft.items,
    comment: draft.comment,
    borderColor: draft.borderColor,
    markerIcon: draft.markerIcon,
    author: {
      displayName: draft.author.displayName,
      displayUserId: draft.author.displayUserId,
      avatarUrl: draft.author.avatarUrl,
    },
    updatedAt: draft.updatedAt,
  };
}

function formatUpdatedAt(updatedAt: string): string {
  return updatedAt;
}

// ---------------------------------------------------------------------------
// DraftCard — InstagramPostCard + action row
// ---------------------------------------------------------------------------

interface DraftCardProps {
  draft: MockDraft;
  onEdit: () => void;
  onDelete: () => void;
  onPublish: () => void;
  onBookmarkClick?: () => void;
  onShareClick?: () => void;
  onAuthorClick?: () => void;
}

function DraftCard({ draft, onEdit, onDelete, onPublish, onBookmarkClick, onShareClick, onAuthorClick }: DraftCardProps) {
  return (
    <div className="flex flex-col">
      {/* 下書きバッジ + 更新日時 */}
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide"
          style={{
            backgroundColor: "var(--muted)",
            color: "var(--muted-foreground)",
          }}
        >
          下書き
        </span>
        <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
          更新: {formatUpdatedAt(draft.updatedAt)}
        </span>
      </div>

      {/* カード本体 */}
      <InstagramPostCard
        ranking={toPostCardRanking(draft)}
        onClick={onEdit}
        onBookmarkClick={onBookmarkClick}
        onShareClick={onShareClick}
        onAuthorClick={onAuthorClick}
        variant="list"
      />

      {/* アクション行 */}
      <div className="flex items-center gap-2 mt-2 px-0.5">
        <button
          type="button"
          onClick={onPublish}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          <Upload size={13} />
          公開
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
          style={{
            borderColor: "var(--destructive)",
            color: "var(--destructive)",
            backgroundColor: "transparent",
          }}
        >
          <Trash2 size={13} />
          削除
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DraftsScreen
// ---------------------------------------------------------------------------

export function DraftsScreen({ onNavigate, onSidebarToggle }: DraftsScreenProps) {
  const drafts = MOCK_DRAFTS;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <AppHeader onNavigate={onNavigate} onSidebarToggle={onSidebarToggle} />

      <div className="mx-auto max-w-[480px] px-4 pb-24 pt-4">
        <div className="space-y-4">
          {/* ヘッダー */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate("ranking-new")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-muted"
              style={{ color: "var(--muted-foreground)" }}
            >
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
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
              下書き一覧
            </h1>
          </div>

          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            下書き件数: {drafts.length}/{MAX_DRAFTS_PER_USER}
          </p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            ログインしていれば、別の端末でも続きから編集できます
          </p>

          {/* 空状態 */}
          {drafts.length === 0 ? (
            <div
              className="rounded-xl border p-8 text-center"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--card)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                下書きはまだありません。
              </p>
              <button
                type="button"
                onClick={() => onNavigate("ranking-new")}
                className="mt-4 inline-flex rounded-lg px-4 py-2 text-sm font-semibold"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
              >
                投稿を作成
              </button>
            </div>
          ) : (
            /* カードリスト */
            <div className="space-y-3">
              {drafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  onEdit={() => onNavigate("ranking-new")}
                  onDelete={() => {
                    /* 削除ハンドラ（モック: no-op） */
                  }}
                  onPublish={() => onNavigate("rankings")}
                  onBookmarkClick={() => {
                    /* ブックマーク（モック: no-op） */
                  }}
                  onShareClick={() => {
                    /* 共有（モック: no-op） */
                  }}
                  onAuthorClick={() => onNavigate("settings")}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
