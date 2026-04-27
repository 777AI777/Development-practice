import type { Screen } from "./types";

interface SelfAnalysisMenuScreenProps {
  onNavigate: (screen: Screen) => void;
}

const MENU_ITEMS = [
  { id: "tag-top3", title: "よく使うタグ TOP3", description: "好みのパターンを確認", cost: 5 },
  { id: "category", title: "カテゴリ分布", description: "どんなジャンルが多い？", cost: 10 },
  { id: "heatmap", title: "時間帯ヒートマップ", description: "いつ投稿しているか", cost: 15 },
  { id: "timeline", title: "タグ変遷タイムライン", description: "好みの変化を振り返る", cost: 25 },
  { id: "dna", title: "好みDNAレポート", description: "あなたの好みの傾向", cost: 40 },
  { id: "annual", title: "年間振り返り", description: "1年間の好きを総覧", cost: 50 },
];

const MOCK_POINT = 42;

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

export function SelfAnalysisMenuScreen({ onNavigate }: SelfAnalysisMenuScreenProps) {
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
          onClick={() => onNavigate("user-profile")}
          className="mr-3 flex items-center justify-center rounded-md p-1 transition hover:bg-muted cursor-pointer bg-transparent border-none"
          style={{ color: "var(--foreground)" }}
          aria-label="戻る"
        >
          <BackArrow />
        </button>
        <h1 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          自己分析
        </h1>
      </header>

      <main className="pt-14 pb-6">
        {/* ポイント残高 */}
        <div className="px-4 pt-4 pb-2 flex justify-between items-center">
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            保有ポイント
          </p>
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {MOCK_POINT} pt
          </p>
        </div>

        {/* メニューカード 2列グリッド */}
        <div className="px-4 grid grid-cols-2 gap-3 mt-2">
          {MENU_ITEMS.map((item) => {
            const canAfford = MOCK_POINT >= item.cost;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => canAfford && onNavigate("self-analysis-result")}
                className="p-4 border rounded-xl text-left transition"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: canAfford ? "var(--card)" : "var(--muted)",
                  opacity: canAfford ? 1 : 0.6,
                  cursor: canAfford ? "pointer" : "not-allowed",
                }}
              >
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: canAfford ? "var(--foreground)" : "var(--muted-foreground)" }}
                >
                  {item.title}
                </p>
                <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
                  {item.description}
                </p>
                <p
                  className="text-xs font-semibold"
                  style={{ color: canAfford ? "var(--primary)" : "var(--muted-foreground)" }}
                >
                  {canAfford ? `${item.cost} pt` : `${item.cost} pt — ポイント不足`}
                </p>
              </button>
            );
          })}
        </div>

        {/* ポイント操作リンク */}
        <div className="px-4 mt-6 flex justify-between">
          <button
            type="button"
            onClick={() => onNavigate("point-purchase")}
            className="text-sm bg-transparent border-none cursor-pointer p-0"
            style={{ color: "var(--primary)" }}
          >
            ポイントを購入
          </button>
          <button
            type="button"
            onClick={() => onNavigate("point-history")}
            className="text-sm bg-transparent border-none cursor-pointer p-0"
            style={{ color: "var(--muted-foreground)" }}
          >
            履歴を見る
          </button>
        </div>

        {/* プレミアムプラン */}
        <div className="px-4 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={() => onNavigate("premium-plan")}
            className="w-full flex items-center justify-between p-3 rounded-xl border transition hover:bg-muted"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
          >
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--foreground)" }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>プレミアムプランを見る</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 12L10 8L6 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* 統計を見る */}
        <div className="px-4 mt-3">
          <button
            type="button"
            onClick={() => onNavigate("post-stats")}
            className="w-full flex items-center justify-between p-3 rounded-xl border transition hover:bg-muted"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
          >
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted-foreground)" }}>
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
              <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>投稿の統計を見る</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--muted-foreground)" }}>
              <path d="M6 12L10 8L6 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
}
