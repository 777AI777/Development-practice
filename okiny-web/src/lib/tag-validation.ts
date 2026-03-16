import { z } from "zod";

import { normalizeTagName } from "./tag-utils";

export const BANNED_WORDS: readonly string[] = [
  "死ね",
  "殺す",
  "アダルト",
  "ポルノ",
  "セックス",
  "ドラッグ",
  "覚醒剤",
  "麻薬",
];

export function containsBannedWord(text: string): boolean {
  if (text === "") return false;
  const cleaned = text
    .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF\u00AD]/g, "")
    .toLowerCase();
  return BANNED_WORDS.some((word) => cleaned.includes(word.toLowerCase()));
}

export const tagNameSchema = z
  .string()
  .transform(normalizeTagName)
  .pipe(
    z
      .string()
      .min(1, "タグ名を入力してください")
      .max(20, "タグ名は20文字以内です"),
  );
