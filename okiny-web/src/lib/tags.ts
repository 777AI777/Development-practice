export const FIXED_TAGS: { id: string; label: string }[] = [
  { id: "movie", label: "映画" },
  { id: "music", label: "音楽" },
  { id: "travel", label: "旅行" },
  { id: "cafe", label: "カフェ" },
  { id: "cosmetics", label: "化粧品" },
  { id: "daily", label: "日用品" },
];

export function getTagLabel(tagId: string): string {
  return FIXED_TAGS.find((tag) => tag.id === tagId)?.label ?? tagId;
}

