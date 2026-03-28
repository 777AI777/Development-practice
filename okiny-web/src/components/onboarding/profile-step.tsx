"use client"

import { useState, useCallback } from "react"

import { useDisplayUserIdCheck } from "@/hooks/use-display-user-id-check"
import {
  normalizeDisplayUserId,
  DISPLAY_USER_ID_MAX_LENGTH,
  DISPLAY_USER_ID_MIN_LENGTH,
} from "@/lib/user-utils"

const DISPLAY_NAME_MAX_LENGTH = 30
const DISPLAY_USER_ID_PATTERN = /^[a-z0-9_]*$/

interface ProfileStepProps {
  onComplete: (displayName: string, displayUserId: string) => void
  isSubmitting: boolean
}

export function ProfileStep({ onComplete, isSubmitting }: ProfileStepProps) {
  const [displayName, setDisplayName] = useState("")
  const [displayUserId, setDisplayUserId] = useState("")
  const [nameTouched, setNameTouched] = useState(false)
  const [idTouched, setIdTouched] = useState(false)

  const normalizedId = normalizeDisplayUserId(displayUserId)
  const { status } = useDisplayUserIdCheck(normalizedId)

  // --- displayName validation ---
  const nameIsEmpty = displayName.trim().length === 0
  const nameIsOverLimit = displayName.trim().length > DISPLAY_NAME_MAX_LENGTH
  const nameIsValid = !nameIsEmpty && !nameIsOverLimit

  const nameValidationMessage = nameTouched
    ? nameIsEmpty
      ? "ユーザーネームを入力してください"
      : nameIsOverLimit
        ? `${DISPLAY_NAME_MAX_LENGTH}文字以内で入力してください`
        : null
    : null

  // --- displayUserId validation ---
  const idIsEmpty = normalizedId.length === 0
  const idIsTooShort =
    !idIsEmpty && normalizedId.length < DISPLAY_USER_ID_MIN_LENGTH
  const idIsOverLimit = normalizedId.length > DISPLAY_USER_ID_MAX_LENGTH
  const idHasInvalidChars =
    !idIsEmpty && !DISPLAY_USER_ID_PATTERN.test(normalizedId)
  const idFormatIsValid =
    !idIsEmpty && !idIsTooShort && !idIsOverLimit && !idHasInvalidChars

  const idValidationMessage = idTouched
    ? idIsEmpty
      ? "ユーザーIDを入力してください"
      : idHasInvalidChars
        ? "半角英数字とアンダースコアのみ使用できます"
        : idIsTooShort
          ? `${DISPLAY_USER_ID_MIN_LENGTH}文字以上で入力してください`
          : idIsOverLimit
            ? `${DISPLAY_USER_ID_MAX_LENGTH}文字以内で入力してください`
            : null
    : null

  const canSubmit =
    nameIsValid && idFormatIsValid && status === "available" && !isSubmitting

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDisplayName(e.target.value)
    },
    [],
  )

  const handleNameBlur = useCallback(() => {
    setNameTouched(true)
  }, [])

  const handleIdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDisplayUserId(normalizeDisplayUserId(e.target.value))
    },
    [],
  )

  const handleIdBlur = useCallback(() => {
    setIdTouched(true)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!nameIsValid || !idFormatIsValid || status !== "available") {
      setNameTouched(true)
      setIdTouched(true)
      return
    }
    onComplete(displayName.trim(), normalizedId)
  }, [nameIsValid, idFormatIsValid, status, onComplete, displayName, normalizedId])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">
          プロフィールを設定しよう
        </h2>
        <p className="text-sm text-muted-foreground">
          他のユーザーに表示される名前とIDを設定してください
        </p>
      </div>

      {/* ユーザーネーム */}
      <div className="space-y-1">
        <label
          htmlFor="profile-display-name"
          className="text-sm font-medium text-foreground"
        >
          ユーザーネーム
        </label>
        <input
          id="profile-display-name"
          type="text"
          value={displayName}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          placeholder="例: おきにー太郎"
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex items-center justify-end gap-2">
          {nameValidationMessage != null && (
            <p className="flex-1 text-xs text-destructive">
              {nameValidationMessage}
            </p>
          )}
          <span className="text-xs text-muted-foreground">
            {displayName.trim().length}/{DISPLAY_NAME_MAX_LENGTH}
          </span>
        </div>
      </div>

      {/* ユーザーID */}
      <div className="space-y-1">
        <label
          htmlFor="profile-display-user-id"
          className="text-sm font-medium text-foreground"
        >
          ユーザーID
        </label>
        <div className="flex items-center rounded-md border border-border focus-within:ring-2 focus-within:ring-ring">
          <span className="select-none pl-3 text-base text-muted-foreground">
            @
          </span>
          <input
            id="profile-display-user-id"
            type="text"
            value={displayUserId}
            onChange={handleIdChange}
            onBlur={handleIdBlur}
            placeholder="例: okiny_taro"
            className="w-full bg-transparent px-2 py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            {idValidationMessage != null ? (
              <p className="text-xs text-destructive">{idValidationMessage}</p>
            ) : (
              <AvailabilityIndicator status={status} />
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {normalizedId.length}/{DISPLAY_USER_ID_MAX_LENGTH}
          </span>
        </div>
      </div>

      {/* 次へボタン */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <LoadingSpinner />
            送信中...
          </span>
        ) : (
          "次へ"
        )}
      </button>
    </div>
  )
}

// --- 内部コンポーネント ---

function AvailabilityIndicator({
  status,
}: {
  status: "idle" | "checking" | "available" | "taken" | "error"
}) {
  switch (status) {
    case "checking":
      return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <LoadingSpinner />
          確認中...
        </span>
      )
    case "available":
      return (
        <span className="text-xs text-green-600">
          ✓ 利用可能
        </span>
      )
    case "taken":
      return (
        <span className="text-xs text-destructive">
          ✗ このIDは既に使われています
        </span>
      )
    case "error":
      return (
        <span className="text-xs text-destructive">
          確認に失敗しました
        </span>
      )
    case "idle":
      return null
  }
}

function LoadingSpinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
