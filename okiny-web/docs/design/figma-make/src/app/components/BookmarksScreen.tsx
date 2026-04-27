import { useState } from "react";
import { AppHeader } from "./AppHeader";
import { InstagramPostCard } from "./shared/InstagramPostCard";
import type { PostCardRanking } from "./shared/InstagramPostCard";
import { ThreadCard } from "./shared/ThreadCard";
import type { ThreadCardData } from "./shared/ThreadCard";
import type { Screen } from "./types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BookmarksScreenProps {
  onNavigate: (screen: Screen) => void;
  onViewProfile?: (userId: string | null) => void;
}

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type BookmarkTab = "posts" | "threads";

// ---------------------------------------------------------------------------
// Mock: bookmarked posts
// ---------------------------------------------------------------------------

interface MockBookmarkedRanking {
  id: string;
  title: string;
  tagName: string;
  /** リンクカード表示用タグ。未指定の投稿はリンクカードを表示しない */
  linkCardTag?: string;
  items: string[];
  borderColor: string;
  markerIcon: string;
  author: {
    displayName: string;
    displayUserId: string;
    avatarUrl: string | null;
  };
  bookmarkCount: number;
  updatedAt: string;
  isBookmarked: boolean;
  comment?: string;
}

const MOCK_BOOKMARKS: MockBookmarkedRanking[] = [
  {
    id: "b1",
    title: "邦画ベスト5",
    tagName: "映画",
    linkCardTag: "映画",
    comment:
      "邦画の名作は何度見ても飽きない。特に宮崎駿作品は海外でも評価が高くて誇らしい。最近は昭和の作品を掘り返すのにハマっている。\n#映画 #邦画 #名作",
    items: ["千と千尋の神隠し", "七人の侍", "東京物語"],
    borderColor: "#FFE5E5",
    markerIcon: "Film",
    author: {
      displayName: "映画好き太郎",
      displayUserId: "movie_lover",
      avatarUrl: "https://i.pravatar.cc/150?u=movie_lover",
    },
    bookmarkCount: 24,
    updatedAt: "2025-03-10",
    isBookmarked: true,
  },
  {
    id: "b2",
    title: "東京カフェベスト5",
    tagName: "カフェ",
    linkCardTag: "カフェ",
    comment:
      "休日のカフェ巡りが生きがい。豆の産地や焙煎度合いで味が全然違うのが面白い。最近はサードウェーブ系よりも昔ながらの喫茶店にも惹かれる。\n#カフェ #東京",
    items: ["ブルーボトルコーヒー", "猿田彦珈琲", "STREAMER COFFEE"],
    borderColor: "#DFECF8",
    markerIcon: "Coffee",
    author: {
      displayName: "カフェ巡り花子",
      displayUserId: "cafe_hanako",
      avatarUrl: "https://i.pravatar.cc/150?u=cafe_hanako",
    },
    bookmarkCount: 15,
    updatedAt: "2025-03-08",
    isBookmarked: true,
  },
  {
    id: "b3",
    title: "好きな音楽TOP5",
    tagName: "音楽",
    comment:
      "世代を超えて愛される名曲ばかり。ドライブ中にかけると気分が上がる。歌詞の深さに気づくのは大人になってからだった。\n#音楽 #洋楽 #名曲",
    items: ["Bohemian Rhapsody", "Imagine", "Hotel California"],
    borderColor: "#F8EFD5",
    markerIcon: "Music4",
    author: {
      displayName: "音楽マニア",
      displayUserId: "music_mania",
      avatarUrl: "https://picsum.photos/seed/music_mania/150/150",
    },
    bookmarkCount: 42,
    updatedAt: "2025-03-05",
    isBookmarked: true,
  },
];

// ---------------------------------------------------------------------------
// Mock: bookmarked threads
// ---------------------------------------------------------------------------

const MOCK_THREAD_BOOKMARKS: (ThreadCardData & { isBookmarked: boolean })[] = [
  {
    id: "tb1",
    theme: "旅先で食べた忘れられない一品は？",
    description:
      "旅行の思い出って食に結びつくことが多い。地元の人に教えてもらった店が大当たりだった経験、みんなもあるはず。ジャンル不問で聞きたい。\n#旅行 #グルメ",
    tag: "旅行",
    author: {
      displayName: "旅するグルメ",
      displayUserId: "travel_gourmet",
      avatarUrl: "https://i.pravatar.cc/150?u=travel_gourmet",
    },
    answerCount: 18,
    createdAt: "2025-03-12",
    lastAnsweredAt: "2025-03-14",
    borderColor: "#DCEDE2",
    isBookmarked: true,
    tags: ["旅行", "グルメ"],
  },
  {
    id: "tb2",
    theme: "在宅勤務のデスク環境、こだわりポイントは？",
    description:
      "リモートワークが定着して早数年。椅子・モニター・照明あたりは投資して正解だった。みんなのこだわりが気になるので共有してほしい。\n#リモートワーク #デスク環境",
    tag: "ライフスタイル",
    author: {
      displayName: "デスクおたく",
      displayUserId: "desk_otaku",
      avatarUrl: "https://picsum.photos/seed/desk_otaku/150/150",
    },
    answerCount: 31,
    createdAt: "2025-03-09",
    lastAnsweredAt: "2025-03-13",
    borderColor: "#E8DFF3",
    isBookmarked: true,
    tags: ["雑談", "おすすめ"],
  },
  {
    id: "tb3",
    theme: "子どもの頃に夢中だったもの、今も好き？",
    description:
      "大人になっても変わらない「好き」ってあるよね。自分は小学生の頃に集めていたカードゲームを最近また始めた。懐かしさと新鮮さが共存する感覚が良い。\n#趣味 #ノスタルジア",
    tag: "趣味",
    author: {
      displayName: "なつかし探検隊",
      displayUserId: "nostalgia_fan",
      avatarUrl: "https://i.pravatar.cc/150?u=nostalgia_fan",
    },
    answerCount: 12,
    createdAt: "2025-03-06",
    lastAnsweredAt: "2025-03-11",
    borderColor: "#F8E7D4",
    isBookmarked: true,
    tags: ["趣味", "雑談"],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPostCardRanking(r: MockBookmarkedRanking): PostCardRanking {
  return {
    id: r.id,
    title: r.title,
    tag: r.linkCardTag,
    items: r.items,
    comment: r.comment,
    borderColor: r.borderColor,
    markerIcon: r.markerIcon,
    author: {
      displayName: r.author.displayName,
      avatarUrl: r.author.avatarUrl ?? undefined,
      displayUserId: r.author.displayUserId,
    },
    bookmarkCount: r.bookmarkCount,
    updatedAt: r.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyBookmarksState() {
  return (
    <div className="px-4 py-16 text-center">
      <p
        className="text-base font-semibold"
        style={{ color: "var(--foreground)" }}
      >
        ブックマークはまだありません。
      </p>
      <p
        className="mt-2 text-sm font-medium underline cursor-pointer"
        style={{ color: "var(--primary)" }}
      >
        投稿一覧を見る
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab bar
// ---------------------------------------------------------------------------

function TabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: BookmarkTab;
  onTabChange: (tab: BookmarkTab) => void;
}) {
  const tabs: { key: BookmarkTab; label: string }[] = [
    { key: "posts", label: "投稿" },
    { key: "threads", label: "スレッド" },
  ];

  return (
    <div
      className="flex border-b mb-4"
      style={{ borderColor: "var(--border)" }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            className="flex-1 py-2.5 text-sm font-semibold text-center bg-transparent border-none cursor-pointer transition"
            style={{
              color: isActive
                ? "var(--foreground)"
                : "var(--muted-foreground)",
              borderBottom: isActive
                ? "2px solid var(--foreground)"
                : "2px solid transparent",
            }}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BookmarksScreen
// ---------------------------------------------------------------------------

export function BookmarksScreen({
  onNavigate,
  onViewProfile,
}: BookmarksScreenProps) {
  const [activeTab, setActiveTab] = useState<BookmarkTab>("posts");

  const postCards: PostCardRanking[] = MOCK_BOOKMARKS.map(toPostCardRanking);

  const handleAuthorClick = (userId: string | undefined) => {
    if (userId && onViewProfile) {
      onViewProfile(userId);
    }
  };

  const handleBookmarkClick = () => {
    // noop for mock
  };

  const handleShareClick = () => {
    // noop for mock
  };

  const hasContent =
    activeTab === "posts"
      ? MOCK_BOOKMARKS.length > 0
      : MOCK_THREAD_BOOKMARKS.length > 0;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <AppHeader onNavigate={onNavigate} />

      <div className="max-w-[480px] mx-auto p-4">
        {/* Header row */}
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate("rankings")}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition hover:bg-muted cursor-pointer bg-transparent border-none"
            style={{ color: "var(--muted-foreground)" }}
          >
            <span aria-hidden="true">{"\u2190"}</span>
          </button>
          <h1
            className="text-lg font-bold"
            style={{ color: "var(--foreground)" }}
          >
            ブックマーク
          </h1>
        </div>

        {/* Tabs */}
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content */}
        {!hasContent ? (
          <EmptyBookmarksState />
        ) : activeTab === "posts" ? (
          <div className="flex flex-col gap-4">
            {postCards.map((card) => (
              <InstagramPostCard
                key={card.id}
                ranking={card}
                onClick={() => onNavigate("ranking-detail")}
                isBookmarked
                onAuthorClick={
                  card.author?.displayUserId
                    ? () => handleAuthorClick(card.author?.displayUserId)
                    : undefined
                }
                onBookmarkClick={handleBookmarkClick}
                onShareClick={handleShareClick}
                variant="list"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {MOCK_THREAD_BOOKMARKS.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                onNavigate={onNavigate}
                isBookmarked={thread.isBookmarked}
                onAuthorClick={
                  thread.author.displayUserId
                    ? () => handleAuthorClick(thread.author.displayUserId)
                    : undefined
                }
                onBookmarkClick={handleBookmarkClick}
                onShareClick={handleShareClick}
              />
            ))}
          </div>
        )}

        <div className="h-4" aria-hidden="true" />
      </div>
    </div>
  );
}
