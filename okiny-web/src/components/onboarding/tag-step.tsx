"use client"

import { useEffect } from "react"
import { TagCombobox } from "@/components/tag-combobox"
import { useTags, getRecommendedTags } from "@/hooks/use-tags"

interface TagStepProps {
  selectedTagId: string
  selectedTagDisplayName: string
  newTagName: string
  onSelect: (tagId: string, tagName: string) => void
  onCreate: (newTagName: string) => void
  onNext: () => void
  onSkip: () => void
}

export function TagStep({
  selectedTagId,
  selectedTagDisplayName,
  newTagName,
  onSelect,
  onCreate,
  onNext,
  onSkip,
}: TagStepProps) {
  const { tags, fetchTags } = useTags()

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const recommendedTags = getRecommendedTags(tags, new Set<string>())
  const hasSelection = selectedTagId !== "" || newTagName !== ""

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-foreground">
          タグを選ぼう
        </h2>
        <p className="text-sm text-muted-foreground">
          ランキングのジャンルを選んでね
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {recommendedTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onSelect(tag.id, tag.name)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                selectedTagId === tag.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>

        <TagCombobox
          value={selectedTagId}
          displayName={selectedTagDisplayName}
          newTagName={newTagName}
          onSelect={onSelect}
          onCreate={onCreate}
        />
      </div>

      <div className="space-y-4">
        <button
          type="button"
          disabled={!hasSelection}
          onClick={onNext}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          次へ
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            スキップ
          </button>
        </div>
      </div>
    </div>
  )
}
