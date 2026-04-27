/**
 * formatRelativeTime — Instagram風の相対時刻表示
 * 例: 「たった今」「5分前」「3時間前」「昨日」「先週」「2月10日」
 */
export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay === 1) return "昨日";
  if (diffDay < 7) return `${diffDay}日前`;
  if (diffWeek === 1) return "先週";
  if (diffWeek < 5) return `${diffWeek}週間前`;

  // Older than ~1 month: show date (e.g. "2月10日")
  const month = date.getMonth() + 1;
  const day = date.getDate();
  // If different year, include year
  if (date.getFullYear() !== now.getFullYear()) {
    return `${date.getFullYear()}年${month}月${day}日`;
  }
  return `${month}月${day}日`;
}

/**
 * formatSmartDate — 「今日」「昨日」「3日前」等のスマート日付表示
 */
export function formatSmartDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "今日";
  if (diffDays === 1) return "昨日";
  if (diffDays < 7) return `${diffDays}日前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`;
  return `${Math.floor(diffDays / 365)}年前`;
}
