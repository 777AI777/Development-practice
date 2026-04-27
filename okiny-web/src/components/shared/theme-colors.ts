// ---------------------------------------------------------------------------
// theme-colors.ts — カラーパレット共通ユーティリティ
// InstagramPostCard / ThreadCard / RankingFormScreen / ThreadCreateScreen /
// ThreadDetailScreen が共有するカラー定義をここに集約する。
// ---------------------------------------------------------------------------

// --- 枠線カラーパレット ---

export const BORDER_COLORS: { value: string; label: string }[] = [
  { value: "#FFE5E5", label: "ベビーコーラル" },
  { value: "#DFECF8", label: "ペールブルー" },
  { value: "#F8EFD5", label: "クリームバニラ" },
  { value: "#DCEDE2", label: "ペールミント" },
  { value: "#E8DFF3", label: "ペールラベンダー" },
  { value: "#F8E7D4", label: "ペールピーチ" },
];

// --- アクセントカラー（マーカー・テキスト用） ---

const ACCENT_COLOR_MAP: Record<string, string> = {
  "#FFE5E5": "#D9544E",
  "#DFECF8": "#3A7BB8",
  "#F8EFD5": "#B08A30",
  "#DCEDE2": "#3E8556",
  "#E8DFF3": "#7457A6",
  "#F8E7D4": "#C07A3E",
};

export function getAccentColor(borderColor: string): string {
  return ACCENT_COLOR_MAP[borderColor] ?? "var(--foreground)";
}

// --- スレッドバッジ用（より濃い色） ---

const THREAD_BADGE_COLOR_MAP: Record<string, string> = {
  "#FFE5E5": "#C0392B",
  "#DFECF8": "#2471A3",
  "#F8EFD5": "#B7950B",
  "#DCEDE2": "#1E8449",
  "#E8DFF3": "#7D3C98",
  "#F8E7D4": "#CA6F1E",
};

export function getThreadBadgeColor(borderColor: string): string {
  return THREAD_BADGE_COLOR_MAP[borderColor.toUpperCase()] ?? borderColor;
}

// --- ダークモード枠線色 ---

const DARK_BORDER_MAP: Record<string, string> = {
  "#FFE5E5": "#3d2525",
  "#DFECF8": "#2d3d55",
  "#F8EFD5": "#3d3520",
  "#DCEDE2": "#253d2d",
  "#E8DFF3": "#2f253d",
  "#F8E7D4": "#3d2e22",
};

export function getEffectiveBorderColor(borderColor: string, isDark?: boolean): string {
  const dark =
    isDark ??
    (typeof document !== "undefined" &&
      document.documentElement.getAttribute("data-theme") === "dark");
  if (!dark) return borderColor;
  return DARK_BORDER_MAP[borderColor] ?? borderColor;
}
