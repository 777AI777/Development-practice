import { useState } from "react";
import type { Screen } from "./types";

interface SelfAnalysisResultScreenProps {
  onNavigate: (screen: Screen) => void;
}

type AnalysisType =
  | "tag-top3"
  | "category"
  | "heatmap"
  | "timeline"
  | "dna"
  | "annual";

const ANALYSIS_TITLES: Record<AnalysisType, string> = {
  "tag-top3": "よく使うタグ TOP3",
  category: "カテゴリ分布",
  heatmap: "時間帯ヒートマップ",
  timeline: "タグ変遷タイムライン",
  dna: "好みDNAレポート",
  annual: "年間振り返り",
};

// --- データ定義 ---

const TAG_DATA = [
  { tag: "映画", count: 18, pct: 100 },
  { tag: "カフェ", count: 12, pct: 67 },
  { tag: "音楽", count: 8, pct: 44 },
];

const CATEGORY_DATA = [
  { label: "エンタメ", pct: 40 },
  { label: "グルメ", pct: 25 },
  { label: "ライフスタイル", pct: 20 },
  { label: "カルチャー", pct: 15 },
];

const DAYS = ["月", "火", "水", "木", "金", "土", "日"];
const TIMES = ["朝", "昼", "午後", "夕方", "夜", "深夜"];
const HEAT_DATA = [
  [0.1, 0.2, 0.1, 0.3, 0.7, 0.2],
  [0.1, 0.1, 0.2, 0.2, 0.5, 0.1],
  [0.1, 0.2, 0.1, 0.2, 0.6, 0.3],
  [0.1, 0.1, 0.2, 0.3, 0.5, 0.2],
  [0.2, 0.2, 0.3, 0.4, 0.8, 0.5],
  [0.3, 0.5, 0.7, 0.6, 0.9, 0.4],
  [0.4, 0.6, 0.8, 0.5, 1.0, 0.3],
];

const TIMELINE_DATA = [
  { month: "11月", tags: ["映画", "本"] },
  { month: "12月", tags: ["映画", "カフェ"] },
  { month: "1月", tags: ["カフェ", "旅行"] },
  { month: "2月", tags: ["音楽", "カフェ"] },
  { month: "3月", tags: ["音楽", "映画", "旅行"] },
  { month: "4月", tags: ["映画", "カフェ"] },
];

const DNA_DATA = [
  { axis: "ビジュアル", score: 80 },
  { axis: "ストーリー", score: 65 },
  { axis: "体験", score: 90 },
  { axis: "味覚", score: 50 },
  { axis: "音楽", score: 70 },
];

const ANNUAL_DATA = [
  { month: "1月", count: 3, theme: "好きな映画" },
  { month: "2月", count: 2, theme: "バレンタインのお菓子" },
  { month: "3月", count: 5, theme: "春に行きたい場所" },
  { month: "4月", count: 4, theme: "新生活のお供" },
  { month: "5月", count: 6, theme: "GWの思い出" },
  { month: "6月", count: 3, theme: "雨の日にはこれ" },
  { month: "7月", count: 7, theme: "夏の定番" },
  { month: "8月", count: 5, theme: "暑い夏に聴く音楽" },
  { month: "9月", count: 4, theme: "秋に読みたい本" },
  { month: "10月", count: 3, theme: "ハロウィン映画" },
  { month: "11月", count: 1, theme: "今年の一冊" },
  { month: "12月", count: 0, theme: null },
];

// --- SVGコンポーネント ---

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

// --- 各分析ビジュアル ---

function TagTop3Visual() {
  return (
    <div className="px-4 pt-4">
      {TAG_DATA.map((item, index) => (
        <div
          key={item.tag}
          className="mb-4 p-4 rounded-xl border"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              {item.tag}
            </span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {item.count}回
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--muted)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${item.pct}%`,
                backgroundColor: "var(--primary)",
                opacity: 1 - index * 0.25,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryVisual() {
  return (
    <div className="px-4 pt-4">
      {CATEGORY_DATA.map((item, i) => (
        <div key={item.label} className="mb-3">
          <div
            className="flex justify-between text-xs mb-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            <span>{item.label}</span>
            <span>{item.pct}%</span>
          </div>
          <div
            className="h-6 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--muted)" }}
          >
            <div
              className="h-full rounded-full flex items-center px-2 text-xs"
              style={{
                width: `${item.pct}%`,
                backgroundColor: "var(--primary)",
                opacity: 1 - i * 0.15,
                color: "var(--primary-foreground)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function HeatmapVisual() {
  return (
    <div className="px-4 pt-4">
      <div className="overflow-x-auto">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `24px repeat(6, 1fr)`,
            gap: "2px",
            minWidth: "280px",
          }}
        >
          <div />
          {TIMES.map((t) => (
            <div
              key={t}
              className="text-center text-xs pb-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              {t}
            </div>
          ))}
          {DAYS.map((day, di) => (
            <>
              <div
                key={day}
                className="text-xs flex items-center justify-center"
                style={{ color: "var(--muted-foreground)" }}
              >
                {day}
              </div>
              {HEAT_DATA[di].map((v, ti) => (
                <div
                  key={`${di}-${ti}`}
                  className="rounded aspect-square"
                  style={{ backgroundColor: `rgba(0, 95, 204, ${v})` }}
                />
              ))}
            </>
          ))}
        </div>
      </div>
      <p className="text-xs mt-3" style={{ color: "var(--muted-foreground)" }}>
        週末の夜と日曜午後に投稿が集中しています。
      </p>
    </div>
  );
}

function TimelineVisual() {
  return (
    <div className="px-4 pt-4">
      <div className="overflow-x-auto">
        <div
          className="flex gap-4 pb-2"
          style={{ minWidth: `${TIMELINE_DATA.length * 100}px` }}
        >
          {TIMELINE_DATA.map((item) => (
            <div key={item.month} className="flex-shrink-0 w-24">
              <p
                className="text-xs text-center mb-2"
                style={{ color: "var(--muted-foreground)" }}
              >
                {item.month}
              </p>
              <div className="flex flex-col gap-1 items-center">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-full text-xs border"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      backgroundColor: "var(--card)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs mt-3" style={{ color: "var(--muted-foreground)" }}>
        春にかけて旅行・音楽への興味が高まっています。
      </p>
    </div>
  );
}

function DnaVisual() {
  const cx = 120;
  const cy = 120;
  const r = 80;

  // 背景グリッド（5段階）
  const bgGrids = [0.2, 0.4, 0.6, 0.8, 1.0].map((ratio) => {
    const pts = DNA_DATA.map((_, i) => {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      return `${cx + r * ratio * Math.cos(angle)},${cy + r * ratio * Math.sin(angle)}`;
    });
    return pts.join(" ");
  });

  const dataPoints = DNA_DATA.map((d, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const ratio = d.score / 100;
    return {
      x: cx + r * ratio * Math.cos(angle),
      y: cy + r * ratio * Math.sin(angle),
      lx: cx + (r + 22) * Math.cos(angle),
      ly: cy + (r + 22) * Math.sin(angle),
      label: d.axis,
    };
  });

  const pathD =
    dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <div className="px-4 pt-4">
      <div className="flex justify-center">
        <svg width="280" height="280" viewBox="0 0 240 240">
          {/* 背景グリッド */}
          {bgGrids.map((pts, i) => (
            <polygon
              key={i}
              points={pts}
              fill="none"
              stroke="var(--border)"
              strokeWidth="1"
            />
          ))}
          {/* 軸線 */}
          {DNA_DATA.map((_, i) => {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={cx + r * Math.cos(angle)}
                y2={cy + r * Math.sin(angle)}
                stroke="var(--border)"
                strokeWidth="1"
              />
            );
          })}
          {/* データ領域 */}
          <path
            d={pathD}
            fill="rgba(0, 95, 204, 0.15)"
            stroke="rgba(0, 95, 204, 0.8)"
            strokeWidth="2"
          />
          {/* データポイント */}
          {dataPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="rgba(0, 95, 204, 0.9)" />
          ))}
          {/* ラベル */}
          {dataPoints.map((p, i) => (
            <text
              key={i}
              x={p.lx}
              y={p.ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fill="var(--muted-foreground)"
            >
              {p.label}
            </text>
          ))}
        </svg>
      </div>
      <div
        className="mt-2 p-4 rounded-xl border"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <p className="text-sm" style={{ color: "var(--foreground)" }}>
          あなたは体験重視タイプ。実際に行って感じることに価値を置く傾向があります。
        </p>
      </div>
    </div>
  );
}

function AnnualVisual() {
  return (
    <div className="px-4 pt-4">
      <div className="relative">
        {ANNUAL_DATA.map((item) => (
          <div
            key={item.month}
            className="flex gap-4 items-start pb-4 border-l ml-4 pl-4 relative"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="absolute -left-1.5 w-3 h-3 rounded-full border-2"
              style={{
                borderColor: "var(--primary)",
                backgroundColor: item.count > 0 ? "var(--primary)" : "var(--background)",
                top: "2px",
              }}
            />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  {item.month}
                </span>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {item.count > 0 ? `${item.count}件` : "—"}
                </span>
              </div>
              {item.theme && (
                <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                  {item.theme}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div
        className="mt-4 p-4 rounded-xl border"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <p className="text-sm" style={{ color: "var(--foreground)" }}>
          2025年は43件の投稿。最もよく使ったテーマは「映画」でした。
        </p>
      </div>
    </div>
  );
}

// --- メイン画面 ---

export function SelfAnalysisResultScreen({ onNavigate }: SelfAnalysisResultScreenProps) {
  const [analysisType, setAnalysisType] = useState<AnalysisType>("tag-top3");
  const title = ANALYSIS_TITLES[analysisType];

  const renderVisual = () => {
    switch (analysisType) {
      case "tag-top3":
        return <TagTop3Visual />;
      case "category":
        return <CategoryVisual />;
      case "heatmap":
        return <HeatmapVisual />;
      case "timeline":
        return <TimelineVisual />;
      case "dna":
        return <DnaVisual />;
      case "annual":
        return <AnnualVisual />;
      default:
        return <TagTop3Visual />;
    }
  };

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
          {title}
        </h1>
      </header>

      <main className="pt-14 pb-6">
        {/* チップセレクタ */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          {([
            { id: "tag-top3", label: "タグTOP3" },
            { id: "category", label: "カテゴリ分布" },
            { id: "heatmap", label: "ヒートマップ" },
            { id: "timeline", label: "タグ変遷" },
            { id: "dna", label: "好みDNA" },
            { id: "annual", label: "年間振り返り" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setAnalysisType(t.id)}
              className="shrink-0 px-3 py-1.5 rounded-full text-sm border transition"
              style={{
                borderColor: analysisType === t.id ? "var(--primary)" : "var(--border)",
                backgroundColor: analysisType === t.id ? "var(--primary)" : "transparent",
                color: analysisType === t.id ? "var(--primary-foreground)" : "var(--muted-foreground)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {renderVisual()}
      </main>
    </div>
  );
}
