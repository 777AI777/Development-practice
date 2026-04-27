interface PostStatsScreenProps {
  onBack: () => void;
  onOpenRanking: (id: string) => void;
}

type PostStat = {
  id: string;
  title: string;
  tag: string;
  impressionCount: number;
  viewCount: number;
  bookmarkCount: number;
  commentCount: number;
  createdAt: string;
};

const MOCK_POST_STATS: PostStat[] = [
  { id: "1", title: "最高のコーヒー豆3選", tag: "カフェ", impressionCount: 1240, viewCount: 380, bookmarkCount: 42, commentCount: 8, createdAt: "2024-04-10" },
  { id: "2", title: "2024年に観た映画ベスト", tag: "映画", impressionCount: 980, viewCount: 310, bookmarkCount: 35, commentCount: 12, createdAt: "2024-04-07" },
  { id: "3", title: "旅先で買ってよかった日用品", tag: "日用品", impressionCount: 740, viewCount: 220, bookmarkCount: 28, commentCount: 5, createdAt: "2024-04-04" },
  { id: "4", title: "最近ハマっているアーティスト", tag: "音楽", impressionCount: 620, viewCount: 180, bookmarkCount: 21, commentCount: 3, createdAt: "2024-04-01" },
  { id: "5", title: "京都で必ず行きたいカフェ", tag: "カフェ", impressionCount: 1560, viewCount: 490, bookmarkCount: 67, commentCount: 15, createdAt: "2024-03-28" },
  { id: "6", title: "冬に聴きたい音楽", tag: "音楽", impressionCount: 480, viewCount: 140, bookmarkCount: 18, commentCount: 2, createdAt: "2024-03-24" },
  { id: "7", title: "好きな化粧品ブランド", tag: "化粧品", impressionCount: 890, viewCount: 260, bookmarkCount: 44, commentCount: 9, createdAt: "2024-03-20" },
  { id: "8", title: "行ってよかった国内旅行先", tag: "旅行", impressionCount: 1120, viewCount: 350, bookmarkCount: 53, commentCount: 11, createdAt: "2024-03-15" },
  { id: "9", title: "毎日使っている文房具", tag: "日用品", impressionCount: 360, viewCount: 110, bookmarkCount: 12, commentCount: 1, createdAt: "2024-03-10" },
  { id: "10", title: "今年観たドキュメンタリー映画", tag: "映画", impressionCount: 520, viewCount: 160, bookmarkCount: 24, commentCount: 6, createdAt: "2024-03-05" },
];

function BackArrow() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function MessageCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 12L10 8L6 4" />
    </svg>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function PostStatsScreen({ onBack, onOpenRanking }: PostStatsScreenProps) {
  const totals = MOCK_POST_STATS.reduce(
    (acc, post) => ({
      impressionCount: acc.impressionCount + post.impressionCount,
      viewCount: acc.viewCount + post.viewCount,
      bookmarkCount: acc.bookmarkCount + post.bookmarkCount,
      commentCount: acc.commentCount + post.commentCount,
    }),
    { impressionCount: 0, viewCount: 0, bookmarkCount: 0, commentCount: 0 }
  );

  const summaryItems = [
    { label: "投稿数", value: MOCK_POST_STATS.length, icon: null },
    { label: "インプレッション", value: formatCount(totals.impressionCount), icon: <BarChartIcon /> },
    { label: "閲覧数", value: formatCount(totals.viewCount), icon: <EyeIcon /> },
    { label: "ブックマーク", value: formatCount(totals.bookmarkCount), icon: <BookmarkIcon /> },
    { label: "コメント", value: formatCount(totals.commentCount), icon: <MessageCircleIcon /> },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* ヘッダー */}
      <header
        className="fixed top-0 left-0 right-0 z-30 h-14 flex items-center px-4 border-b"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
          maxWidth: "480px",
          margin: "0 auto",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="mr-3 flex items-center justify-center rounded-md p-1 transition hover:bg-muted cursor-pointer bg-transparent border-none"
          style={{ color: "var(--foreground)" }}
          aria-label="戻る"
        >
          <BackArrow />
        </button>
        <h1 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          投稿の統計
        </h1>
      </header>

      <main className="pt-14 pb-6">
        {/* サマリーカード */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
            自分の投稿の合計
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="p-3 rounded-xl border flex flex-col gap-1"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
              >
                <div className="flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                  {item.icon}
                  <span className="text-xs">{item.label}</span>
                </div>
                <p className="text-xl font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 投稿別統計リスト */}
        <div className="px-4 mt-4">
          <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
            投稿ごとの内訳
          </p>
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--border)" }}
          >
            {MOCK_POST_STATS.map((post, index) => {
              const isLast = index === MOCK_POST_STATS.length - 1;
              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => onOpenRanking(post.id)}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 transition hover:bg-muted bg-transparent border-none cursor-pointer"
                  style={{
                    backgroundColor: "var(--card)",
                    borderBottom: isLast ? "none" : "1px solid var(--border)",
                  }}
                >
                  {/* タイトル・タグ */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium leading-snug truncate"
                      style={{ color: "var(--foreground)" }}
                    >
                      {post.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--primary)" }}>
                      #{post.tag}
                    </p>
                    {/* 数値バッジ行 */}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                        <BarChartIcon />
                        <span className="text-xs">{formatCount(post.impressionCount)}</span>
                      </span>
                      <span className="flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                        <EyeIcon />
                        <span className="text-xs">{formatCount(post.viewCount)}</span>
                      </span>
                      <span className="flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                        <BookmarkIcon />
                        <span className="text-xs">{post.bookmarkCount}</span>
                      </span>
                      <span className="flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                        <MessageCircleIcon />
                        <span className="text-xs">{post.commentCount}</span>
                      </span>
                    </div>
                  </div>

                  {/* 右矢印 */}
                  <div className="shrink-0 mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    <ChevronRightIcon />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 注記 */}
        <p className="px-4 mt-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
          統計は自分だけが見られます。他のユーザーには表示されません。
        </p>
      </main>
    </div>
  );
}
