"use client"

import { useState, useCallback } from "react"

const TITLE_MAX_LENGTH = 50

interface TitleStepProps {
  title: string
  selectedTagDisplayName: string
  onTitleChange: (title: string) => void
  onNext: () => void
  onBack: () => void
}

export function TitleStep({
  title,
  selectedTagDisplayName,
  onTitleChange,
  onNext,
  onBack,
}: TitleStepProps) {
  const [touched, setTouched] = useState(false)

  const isEmpty = title.length === 0
  const isOverLimit = title.length > TITLE_MAX_LENGTH
  const isValid = !isEmpty && !isOverLimit

  const validationMessage = touched
    ? isEmpty
      ? "ランキング名を入力してください"
      : isOverLimit
        ? `${TITLE_MAX_LENGTH}文字以内で入力してください`
        : null
    : null

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onTitleChange(e.target.value)
    },
    [onTitleChange],
  )

  const handleBlur = useCallback(() => {
    setTouched(true)
  }, [])

  const handleNext = useCallback(() => {
    if (!isValid) {
      setTouched(true)
      return
    }
    onNext()
  }, [isValid, onNext])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">
          ランキング名をつけよう
        </h2>
        <p className="text-sm text-muted-foreground">
          「{selectedTagDisplayName}」のランキング
        </p>
      </div>

      <div className="space-y-1">
        <input
          type="text"
          value={title}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-label="ランキング名"
          placeholder="例: 好きな映画TOP5"
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex items-center justify-end gap-2">
          {validationMessage != null && (
            <p className="flex-1 text-xs text-destructive">
              {validationMessage}
            </p>
          )}
          <span className="text-xs text-muted-foreground">
            {title.length}/{TITLE_MAX_LENGTH}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!isValid}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          次へ
        </button>
      </div>
    </div>
  )
}
