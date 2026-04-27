import type { Screen } from "./types";

interface PremiumPlanScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface PlanFeature {
  label: string;
  free: string;
  premium: string;
}

const PLAN_FEATURES: PlanFeature[] = [
  { label: "広告", free: "あり", premium: "なし" },
  { label: "自己分析メニュー", free: "一部（ポイント制）", premium: "全メニュー解放" },
  { label: "ポイント獲得", free: "通常", premium: "2倍速" },
  { label: "年間振り返りレポート", free: "—", premium: "無料" },
  { label: "下書き上限", free: "5件", premium: "15件" },
];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--success)" }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function BackArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export function PremiumPlanScreen({ onNavigate }: PremiumPlanScreenProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <header
        className="fixed top-0 left-0 right-0 z-30 h-14 flex items-center gap-3 px-4 border-b max-w-[480px] mx-auto"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <button
          type="button"
          onClick={() => onNavigate("settings")}
          className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer"
          style={{ color: "var(--foreground)" }}
          aria-label="戻る"
        >
          <BackArrow />
        </button>
        <h1 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          プラン比較
        </h1>
      </header>

      <div className="pt-14 max-w-[480px] mx-auto">
        {/* プランヘッダー */}
        <div className="grid grid-cols-3 px-4 pt-6 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div />
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>フリー</p>
            <p className="text-lg font-bold mt-1" style={{ color: "var(--foreground)" }}>¥0</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: "var(--premium)" }}>プレミアム</p>
            <p className="text-lg font-bold mt-1" style={{ color: "var(--foreground)" }}>
              ¥550
              <span className="text-xs font-normal" style={{ color: "var(--muted-foreground)" }}>/月</span>
            </p>
          </div>
        </div>

        {/* 比較表 */}
        <div className="px-4">
          {PLAN_FEATURES.map((feature, idx) => (
            <div
              key={feature.label}
              className="grid grid-cols-3 py-3 items-center"
              style={{ borderBottom: idx < PLAN_FEATURES.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <p className="text-sm" style={{ color: "var(--foreground)" }}>
                {feature.label}
              </p>
              <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
                {feature.free}
              </p>
              <div className="flex items-center justify-center gap-1">
                <CheckIcon />
                <span className="text-xs" style={{ color: "var(--foreground)" }}>
                  {feature.premium}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-4 pt-8 pb-8">
          <button
            type="button"
            className="w-full py-3 rounded-xl text-base font-semibold transition hover:opacity-90"
            style={{ backgroundColor: "var(--premium)", color: "var(--premium-foreground)" }}
          >
            プレミアムに登録する
          </button>
          <p className="text-xs text-center mt-3" style={{ color: "var(--muted-foreground)" }}>
            いつでもキャンセル可能
          </p>
        </div>
      </div>
    </div>
  );
}
