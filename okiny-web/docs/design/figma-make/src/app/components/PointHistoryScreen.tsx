import type { Screen } from "./types";

interface PointHistoryScreenProps {
  onNavigate: (screen: Screen) => void;
}

type HistoryItem = {
  date: string;
  type: "earn" | "spend";
  label: string;
  amount: number;
};

const MOCK_HISTORY: HistoryItem[] = [
  { date: "4月15日", type: "earn", label: "投稿", amount: 1 },
  { date: "4月14日", type: "spend", label: "タグTOP3 分析", amount: -5 },
  { date: "4月13日", type: "earn", label: "投稿", amount: 1 },
  { date: "4月12日", type: "earn", label: "投稿", amount: 1 },
  { date: "4月10日", type: "spend", label: "カテゴリ分布 分析", amount: -10 },
  { date: "4月9日", type: "earn", label: "投稿", amount: 1 },
  { date: "4月8日", type: "earn", label: "投稿", amount: 1 },
  { date: "4月5日", type: "earn", label: "投稿", amount: 1 },
  { date: "4月1日", type: "earn", label: "購入（10pt）", amount: 10 },
  { date: "3月30日", type: "earn", label: "投稿", amount: 1 },
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

function EarnIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l3 3" />
      <path d="M9 12h6" />
      <path d="M12 16V12" />
    </svg>
  );
}

function SpendIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9 12h6" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5c0 1.4-1.1 2-2.5 2s-2.5.6-2.5 2c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5" />
    </svg>
  );
}

export function PointHistoryScreen({ onNavigate }: PointHistoryScreenProps) {
  const balance = MOCK_HISTORY.reduce((sum, item) => sum + item.amount, 0);

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
          onClick={() => onNavigate("self-analysis")}
          className="mr-3 flex items-center justify-center rounded-md p-1 transition hover:bg-muted cursor-pointer bg-transparent border-none"
          style={{ color: "var(--foreground)" }}
          aria-label="戻る"
        >
          <BackArrow />
        </button>
        <h1 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          ポイント履歴
        </h1>
      </header>

      <main className="pt-14 pb-6">
        {/* 残高サマリー */}
        <div
          className="mx-4 mt-4 mb-4 p-4 rounded-xl border flex items-center gap-3"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        >
          <div style={{ color: "var(--primary)" }}>
            <CoinIcon />
          </div>
          <div className="flex-1">
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              現在の残高
            </p>
            <p className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
              {balance} pt
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("point-purchase")}
            className="text-xs px-3 py-1.5 rounded-lg border-none cursor-pointer"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            購入
          </button>
        </div>

        {/* 履歴一覧 */}
        <div className="px-4">
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--border)" }}
          >
            {MOCK_HISTORY.map((item, index) => {
              const isLast = index === MOCK_HISTORY.length - 1;
              const isEarn = item.type === "earn";
              return (
                <div
                  key={`${item.date}-${item.label}-${index}`}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    backgroundColor: "var(--card)",
                    borderBottom: isLast ? "none" : "1px solid var(--border)",
                  }}
                >
                  {/* アイコン */}
                  <div
                    style={{
                      color: isEarn ? "var(--primary)" : "var(--muted-foreground)",
                    }}
                  >
                    {isEarn ? <EarnIcon /> : <SpendIcon />}
                  </div>

                  {/* 日付・ラベル */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm leading-snug truncate"
                      style={{ color: "var(--foreground)" }}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      {item.date}
                    </p>
                  </div>

                  {/* 金額 */}
                  <p
                    className="text-sm font-semibold shrink-0"
                    style={{
                      color: isEarn ? "var(--primary)" : "var(--muted-foreground)",
                    }}
                  >
                    {isEarn ? `+${item.amount}` : item.amount} pt
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
