interface TagLike {
  readonly id: string;
  readonly name: string;
}

export function normalizeTagName(name: string): string {
  return name.trim().normalize("NFKC");
}

export function getTagLabelFromList(
  tagId: string,
  tags: readonly TagLike[]
): string {
  if (tags.length === 0) return "...";
  return tags.find((tag) => tag.id === tagId)?.name ?? tagId;
}
