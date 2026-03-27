import type { RankingInput } from "../types";

/**
 * フォームが完全に空かどうかを判定する。
 * 戻るボタンで「下書き保存しますか？」ダイアログの表示判定に使用。
 *
 * 全条件を満たす場合のみ true:
 * - title が空（trim後）
 * - tagId が空文字
 * - items が全て空（trim後）
 * - newTagName が undefined or 空（trim後）
 */
export function isFormEmpty(
  form: RankingInput,
  newTagName?: string
): boolean {
  const isTitleEmpty = form.title.trim() === "";
  const isTagIdEmpty = form.tagId === "";
  const areItemsEmpty = form.items.every((item) => item.trim() === "");
  const isNewTagNameEmpty =
    newTagName === undefined || newTagName.trim() === "";

  return isTitleEmpty && isTagIdEmpty && areItemsEmpty && isNewTagNameEmpty;
}
