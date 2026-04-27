"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { RankingItems } from "@/lib/types"
import { publishedApiClient } from "@/lib/publish/client"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/toast-provider"
import { useSessionUser } from "@/hooks/use-session-user"
import { trackEvent } from "@/lib/analytics"
import { StepIndicator } from "./step-indicator"
import { ProfileStep } from "./profile-step"
import { TagStep } from "./tag-step"
import { TitleStep } from "./title-step"
import { ItemsStep } from "./items-step"

type WizardStep = 1 | 2 | 3 | 4

interface OnboardingWizardProps {
  profileOnly?: boolean
}

export function OnboardingWizard({ profileOnly = false }: OnboardingWizardProps) {
  const router = useRouter()
  const { pushToast } = useToast()
  const { updateDisplayName, updateDisplayUserId } = useSessionUser()

  // Step state
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)

  // Form data (persisted across steps)
  const [selectedTagId, setSelectedTagId] = useState("")
  const [selectedTagDisplayName, setSelectedTagDisplayName] = useState("")
  const [newTagName, setNewTagName] = useState("")
  const [title, setTitle] = useState("")
  const [items, setItems] = useState<RankingItems>(["", "", ""])

  // UI control
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    trackEvent("onboarding_start", {})
  }, [])

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev === 1) {
        trackEvent("onboarding_step", { step: 2 })
        return 2
      }
      if (prev === 2) {
        trackEvent("onboarding_step", { step: 3 })
        return 3
      }
      if (prev === 3) {
        trackEvent("onboarding_step", { step: 4 })
        return 4
      }
      return prev
    })
  }, [])

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev === 4) return 3
      if (prev === 3) return 2
      if (prev === 2) return 1
      return prev
    })
  }, [])

  const handleProfileComplete = useCallback(
    async (displayName: string, displayUserId: string) => {
      setIsSubmitting(true)
      setErrorMessage(null)
      try {
        // displayUserId を先に保存（conflict 検出を先行させ、displayName の不要な変更を防ぐ）
        const idResult = await updateDisplayUserId(displayUserId)
        if (idResult === "conflict") {
          setErrorMessage("このユーザーIDは既に使われています")
          return
        }
        if (idResult !== "success") {
          setErrorMessage("ユーザーIDの保存に失敗しました")
          return
        }
        const nameResult = await updateDisplayName(displayName)
        if (nameResult !== "success") {
          setErrorMessage("ユーザーネームの保存に失敗しました")
          return
        }

        if (profileOnly) {
          const supabase = createClient()
          await supabase.auth.refreshSession()
          router.push("/rankings")
        } else {
          handleNext()
        }
      } catch {
        setErrorMessage("保存に失敗しました")
      } finally {
        setIsSubmitting(false)
      }
    },
    [updateDisplayName, updateDisplayUserId, profileOnly, router, handleNext]
  )

  const handleTagSelect = useCallback(
    (tagId: string, tagName: string) => {
      setSelectedTagId(tagId)
      setSelectedTagDisplayName(tagName)
      setNewTagName("")
    },
    []
  )

  const handleTagCreate = useCallback((name: string) => {
    setNewTagName(name)
    setSelectedTagId("")
    setSelectedTagDisplayName(name)
  }, [])

  const handleItemChange = useCallback(
    (index: number, value: string) => {
      setItems((prev) => {
        return prev.map((item, i) => (i === index ? value : item)) as RankingItems
      })
    },
    []
  )

  const handleSkip = useCallback(async () => {
    try {
      const supabase = createClient()
      await supabase.auth.updateUser({ data: { onboarded: true } })
    } catch {
      // Flag update failure is non-blocking — continue to rankings
    }
    trackEvent("onboarding_skip", {})
    router.push("/rankings")
  }, [router])

  const handlePublish = useCallback(async () => {
    setIsPublishing(true)
    setErrorMessage(null)

    try {
      let tagId: string

      if (newTagName) {
        const tag = await publishedApiClient.createTag(newTagName)
        tagId = tag.id
      } else {
        tagId = selectedTagId
      }

      const ranking = await publishedApiClient.createPublishedRanking({
        ranking: { title, tagId, items, isPublic: true, borderColor: "#FFE5E5", markerIcon: "Heart" },
      })

      try {
        const supabase = createClient()
        await supabase.auth.updateUser({ data: { onboarded: true } })
      } catch {
        // Flag update failure is non-blocking
      }

      trackEvent("onboarding_complete", {})
      pushToast({ message: "ランキングを公開しました！", type: "success" })
      router.push(`/rankings/${ranking.id}`)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "公開に失敗しました。もう一度お試しください。"
      )
    } finally {
      setIsPublishing(false)
    }
  }, [newTagName, selectedTagId, title, items, pushToast, router])

  return (
    <>
      <StepIndicator
        currentStep={currentStep}
        totalSteps={profileOnly ? 1 : 4}
      />

      {currentStep === 1 && (
        <ProfileStep
          onComplete={handleProfileComplete}
          isSubmitting={isSubmitting}
        />
      )}

      {errorMessage && currentStep === 1 && (
        <p className="mt-2 text-center text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      {currentStep === 2 && (
        <TagStep
          selectedTagId={selectedTagId}
          selectedTagDisplayName={selectedTagDisplayName}
          newTagName={newTagName}
          onSelect={handleTagSelect}
          onCreate={handleTagCreate}
          onNext={handleNext}
          onSkip={handleSkip}
        />
      )}

      {currentStep === 3 && (
        <TitleStep
          title={title}
          selectedTagDisplayName={selectedTagDisplayName}
          onTitleChange={setTitle}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 4 && (
        <ItemsStep
          title={title}
          items={items}
          onItemChange={handleItemChange}
          onPublish={handlePublish}
          onBack={handleBack}
          isPublishing={isPublishing}
          errorMessage={errorMessage}
        />
      )}
    </>
  )
}
