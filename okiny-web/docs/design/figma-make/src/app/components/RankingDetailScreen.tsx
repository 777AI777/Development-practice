import { useState } from "react";
import { AppHeader } from "./AppHeader";
import type { Screen } from "./types";
import { InstagramPostCard } from "./shared/InstagramPostCard";
import type { PostCardRanking } from "./shared/InstagramPostCard";

interface RankingDetailScreenProps {
  onNavigate: (screen: Screen) => void;
  onSidebarToggle?: () => void;
  onViewProfile?: (userId: string | null) => void;
  onOpenRanking?: (id: string) => void;
}

const MOCK_AUTHOR = {
  displayName: "Taro Yamada",
  avatarUrl: "https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=80&h=80&fit=crop&crop=face" as string | null,
  displayUserId: "taro_y",
};

const MOCK_RANKING: PostCardRanking & {
  isBookmarked: boolean;
  isOwner: boolean;
} = {
  id: "1",
  title: "2026年に観て震えた邦画",
  tag: "映画",
  comment:
    "今年は邦画の当たり年だった気がする。特に上位3作は劇場で号泣してしまった。重たいテーマの作品が多かったけど、観終わったあとに不思議と前を向ける力をもらえた。好きな人にはぜひ観てほしいラインナップ。\n#映画 #邦画 #2026年ベスト",
  items: [
    "夜明けのすべて",
    "怪物の木こり",
    "ある閉ざされた雪の山荘で",
  ],
  borderColor: "#DFECF8",
  markerIcon: "Film",
  author: {
    displayName: MOCK_AUTHOR.displayName,
    avatarUrl: MOCK_AUTHOR.avatarUrl ?? undefined,
    displayUserId: MOCK_AUTHOR.displayUserId,
  },
  viewCount: 128,
  bookmarkCount: 42,
  commentCount: 7,
  isBookmarked: false,
  isOwner: true,
  createdAt: "2026-03-15T10:00:00Z",
  updatedAt: "2026-03-15T10:00:00Z",
};

/* --- Icons (実アプリから正確に転写) --- */

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

function ShareIcon() {
  return (
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
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function BookmarkFilledIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

function BookmarkOutlineIcon16() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

function MuteIcon() {
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
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

function BlockIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

/* --- 類似投稿モックデータ --- */

const SIMILAR_RANKINGS: PostCardRanking[] = [
  {
    id: "sim-1",
    title: "最近ハマった邦画",
    tag: "映画",
    comment: "どれも観終わったあとしばらく余韻が続いた。ドライブ・マイ・カーは3回観てもまだ新しい発見がある。花束みたいな恋をしたは友達と観ると感想が全然違って面白い。\n#映画 #邦画好き",
    items: ["怪物", "ドライブ・マイ・カー", "花束みたいな恋をした"],
    borderColor: "#FFE5E5",
    markerIcon: "Film",
    author: { displayName: "Hanako Tanaka", displayUserId: "hanako_t", avatarUrl: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=80&h=80&fit=crop&crop=face" },
    viewCount: 88,
    bookmarkCount: 14,
    createdAt: "2026-02-10T10:00:00Z",
    updatedAt: "2026-02-10T10:00:00Z",
  },
  {
    id: "sim-2",
    title: "泣ける是枝作品",
    tag: "映画",
    comment: "是枝監督の作品はどれも静かに刺さる。万引き家族はラストシーンの解釈で何時間でも語れる。家族の在り方について考えさせられる3本。\n#映画 #是枝裕和",
    items: ["万引き家族", "そして父になる", "誰も知らない"],
    borderColor: "#DCEDE2",
    markerIcon: "Film",
    author: { displayName: "Yuki Sato", displayUserId: "yuki_s", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" },
    viewCount: 210,
    bookmarkCount: 34,
    createdAt: "2026-01-20T10:00:00Z",
    updatedAt: "2026-01-20T10:00:00Z",
  },
  {
    id: "sim-3",
    title: "映像が美しい日本映画",
    tag: "映画",
    comment: "スクリーンで観てほしい作品たち。アニメーションの色彩設計がどれも圧倒的で、Blu-rayだと物足りなくなる。映画館で観る体験そのものが作品の一部だと思う。\n#映画 #アニメ映画 #映像美",
    items: ["プロメア", "この世界の片隅に", "天気の子"],
    borderColor: "#E8DFF3",
    markerIcon: "Film",
    author: { displayName: "Kenji Suzuki", displayUserId: "kenji_sz", avatarUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=80&h=80&fit=crop" },
    viewCount: 152,
    bookmarkCount: 28,
    createdAt: "2026-01-05T10:00:00Z",
    updatedAt: "2026-01-05T10:00:00Z",
  },
  {
    id: "sim-4",
    title: "何度でも観たい邦画",
    tag: "映画",
    comment: "飽きないのはこの3本だけ。千と千尋は子どもの頃から数えきれないほど観てるけど、大人になってから気づく描写がまだある。七人の侍は白黒なのに映像の迫力が段違い。\n#映画 #名作",
    items: ["千と千尋の神隠し", "七人の侍", "ゴジラ-1.0"],
    borderColor: "#F8EFD5",
    markerIcon: "Film",
    author: { displayName: "Aoi Kimura", displayUserId: "aoi_k", avatarUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=80&h=80&fit=crop&crop=face" },
    viewCount: 305,
    bookmarkCount: 51,
    createdAt: "2025-12-15T10:00:00Z",
    updatedAt: "2025-12-15T10:00:00Z",
  },
  {
    id: "sim-5",
    title: "友達に勧めたい映画",
    tag: "映画",
    comment: "映画を語り合いたくなる作品ばかり。シン・エヴァは完結してくれたこと自体に感謝している。竜とそばかすの姫は賛否あるけど、自分は好き。\n#映画 #アニメ",
    items: ["シン・エヴァンゲリオン", "竜とそばかすの姫", "岬のマヨイガ"],
    borderColor: "#DFECF8",
    markerIcon: "Film",
    author: { displayName: "Ryota Kato", displayUserId: "ryota_k", avatarUrl: "https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=80&h=80&fit=crop&crop=face" },
    viewCount: 77,
    bookmarkCount: 9,
    createdAt: "2025-11-28T10:00:00Z",
    updatedAt: "2025-11-28T10:00:00Z",
  },
  {
    id: "sim-6",
    title: "サントラが好きな映画",
    tag: "映画",
    comment: "音楽だけで映像が浮かぶ作品。耳をすませばのカントリー・ロードは何度聴いても泣ける。サントラを買って通勤中に聴くのが日課になってる。\n#映画 #サントラ #音楽",
    items: ["時をかける少女", "銀河鉄道の夜", "耳をすませば"],
    borderColor: "#F8E7D4",
    markerIcon: "Film",
    author: { displayName: "Mika Nishida", displayUserId: "mika_n", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face" },
    viewCount: 130,
    bookmarkCount: 22,
    createdAt: "2025-11-10T10:00:00Z",
    updatedAt: "2025-11-10T10:00:00Z",
  },
];

export function RankingDetailScreen({ onNavigate, onSidebarToggle, onViewProfile, onOpenRanking }: RankingDetailScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(MOCK_RANKING.isBookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(MOCK_RANKING.bookmarkCount);
  const [similarBookmarkedIds, setSimilarBookmarkedIds] = useState<Set<string>>(new Set());

  const isOwner = MOCK_RANKING.isOwner;

  const handleToggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleToggleBookmark = () => {
    const next = !isBookmarked;
    setIsBookmarked(next);
    setBookmarkCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));
  };

  const handleSimilarBookmarkClick = (id: string) => {
    setSimilarBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSimilarShareClick = (id: string) => {
    void id; // no-op for mock
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onNavigate={onNavigate} onSidebarToggle={onSidebarToggle} />

      <div className="max-w-[480px] mx-auto px-4 py-6 space-y-4">
        {/* Header row: back + title + share/menu */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onNavigate("rankings")}
            className="inline-flex items-center rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="戻る"
          >
            <BackArrowIcon />
          </button>
          <div className="flex-1" />
          <div className="flex flex-shrink-0 items-center gap-1">
            {/* 共有ボタン（公開投稿）+ 編集・削除メニュー（オーナーのみ） */}
            {isOwner && (
              <div className="relative">
                <button
                  type="button"
                  onClick={handleToggleMenu}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-xl font-black text-foreground transition hover:bg-muted"
                  aria-label="メニュー"
                >
                  <span className="leading-none">{"\u22EF"}</span>
                </button>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-card py-1 shadow-md">
                      <button
                        type="button"
                        onClick={() => setMenuOpen(false)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition hover:bg-muted"
                      >
                        <ShareIcon />
                        共有
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onNavigate("ranking-edit");
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-foreground transition hover:bg-muted"
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onNavigate("delete-confirm");
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-destructive transition hover:bg-muted"
                      >
                        削除
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* メイン投稿カード（著者・タイトル・コメント・並列項目・統計） */}
        <InstagramPostCard
          variant="detail"
          ranking={{
            ...MOCK_RANKING,
            bookmarkCount: bookmarkCount,
          }}
          isBookmarked={isBookmarked}
          onBookmarkClick={handleToggleBookmark}
          onShareClick={() => {/* share action */}}
          onAuthorClick={
            MOCK_RANKING.author?.displayUserId && onViewProfile
              ? () => onViewProfile(MOCK_RANKING.author!.displayUserId!)
              : undefined
          }
          className="w-full"
        />

        {/* ブックマーク切替ボタン（非オーナー時のみ） */}
        {!isOwner && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isBookmarked
                  ? "text-primary hover:bg-muted"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              aria-label={isBookmarked ? "ブックマーク解除" : "ブックマーク"}
              aria-pressed={isBookmarked}
            >
              {isBookmarked ? <BookmarkFilledIcon /> : <BookmarkOutlineIcon16 />}
              <span>{isBookmarked ? "保存済み" : "保存"}</span>
            </button>
          </div>
        )}

        {/* 非オーナー向けユーザーアクションメニュー */}
        {!isOwner && (
          <div className="relative flex justify-end">
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-foreground transition hover:bg-muted"
              aria-label="ユーザーメニュー"
            >
              <span className="text-base font-black leading-none">{"\u22EF"}</span>
            </button>
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-border bg-card py-1 shadow-md">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition hover:bg-muted"
                  >
                    <MuteIcon />
                    {MOCK_AUTHOR.displayName}さんをミュート
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-destructive transition hover:bg-muted"
                  >
                    <BlockIcon />
                    {MOCK_AUTHOR.displayName}さんをブロック
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* 類似の投稿 */}
      </div>

      <section
        className="-mx-0 px-4 pt-4 pb-8"
        style={{ backgroundColor: "var(--muted)" }}
      >
        <div className="max-w-[480px] mx-auto">
          <h2
            className="px-1 py-3 text-base font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            もっと見つける
          </h2>
          <div className="flex flex-col space-y-3">
            {SIMILAR_RANKINGS.map((similar) => (
              <InstagramPostCard
                key={similar.id}
                ranking={similar}
                isBookmarked={similarBookmarkedIds.has(similar.id)}
                onClick={() => onOpenRanking?.(similar.id)}
                onBookmarkClick={() => handleSimilarBookmarkClick(similar.id)}
                onShareClick={() => handleSimilarShareClick(similar.id)}
                onAuthorClick={
                  similar.author?.displayUserId && onViewProfile
                    ? () => onViewProfile(similar.author!.displayUserId!)
                    : undefined
                }
                variant="list"
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

