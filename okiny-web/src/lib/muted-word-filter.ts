import type { RankingItems } from "@/lib/types";

/**
 * ミュートワードに一致するランキングを除外する。
 * チェック対象: タイトル、ランキングアイテム（5つ）、タグ名。
 * 大文字小文字を区別しない。
 */
export function filterByMutedWords<
  T extends {
    title: string;
    items: RankingItems;
    tagName?: string;
  },
>(rankings: T[], mutedWords: string[]): T[] {
  if (mutedWords.length === 0) return rankings;

  const lowerWords = mutedWords.map((w) => w.toLowerCase());

  return rankings.filter((ranking) => {
    const titleLower = ranking.title.toLowerCase();
    const tagLower = (ranking.tagName ?? "").toLowerCase();

    for (const word of lowerWords) {
      if (titleLower.includes(word)) return false;
      if (tagLower && tagLower.includes(word)) return false;
      for (const itemText of ranking.items) {
        if (itemText.toLowerCase().includes(word)) return false;
      }
    }
    return true;
  });
}
