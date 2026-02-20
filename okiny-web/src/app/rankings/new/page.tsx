"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { RankingForm } from "@/components/ranking-form";
import { useToast } from "@/components/toast-provider";
import { draftRepository } from "@/lib/drafts/client-repository";
import { saveDraftWithFeedback } from "@/lib/drafts/save-draft-with-feedback";
import { trackEvent } from "@/lib/analytics";
import { publishRanking } from "@/lib/publish/publish-ranking";
import { publishedApiClient } from "@/lib/publish/client";
import { useSessionUser } from "@/hooks/use-session-user";
import type { RankingInput, RankingItems } from "@/lib/types";

function toRankingItems(items: string[]): RankingItems {
  return [items[0] ?? "", items[1] ?? "", items[2] ?? "", items[3] ?? "", items[4] ?? ""];
}

const EMPTY_ITEMS: RankingItems = ["", "", "", "", ""];

export default function NewRankingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const { user } = useSessionUser();
  const [initialDraft, setInitialDraft] = useState<RankingInput | undefined>();
  const [activeDraftId, setActiveDraftId] = useState<string | undefined>();
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    const draftId = searchParams.get("draftId");
    const preselectedTagId = searchParams.get("tagId");
    if (!draftId) {
      if (preselectedTagId) {
        setInitialDraft({
          title: "",
          tagId: preselectedTagId,
          items: EMPTY_ITEMS,
        });
      } else {
        setInitialDraft(undefined);
      }
      setActiveDraftId(undefined);
      return;
    }

    void draftRepository.list(user.id).then((drafts) => {
      const target = drafts.find((draft) => draft.draftId === draftId);
      if (!target) {
        return;
      }
      setInitialDraft({
        title: target.title,
        tagId: target.tagId,
        items: toRankingItems([...target.items]),
      });
      setActiveDraftId(target.draftId);
    });
  }, [searchParams, user]);

  useEffect(() => {
    if (!user || trackedRef.current) {
      return;
    }
    trackEvent("ranking_create_start", {
      user_id: user.id,
      source: activeDraftId ? "draft" : "list",
    });
    trackedRef.current = true;
  }, [activeDraftId, user]);

  const handlePublish = async (value: RankingInput) => {
    if (!user) return;
    const result = await publishRanking({
      userId: user.id,
      ranking: value,
      draftId: activeDraftId,
      apiClient: publishedApiClient,
      draftRepository,
    });
    pushToast(result.toast);
    if (result.ok) {
      trackEvent("ranking_publish_success", {
        user_id: user.id,
        ranking_id: result.published.id,
        tag_id: value.tagId,
      });
      router.push(`/rankings/${result.published.id}`);
    }
  };

  const handleSaveDraft = async (value: RankingInput) => {
    if (!user) return;
    const result = await saveDraftWithFeedback(draftRepository, user.id, {
      ...value,
      draftId: activeDraftId,
    });
    pushToast(result.toast);
    if (result.ok) {
      trackEvent("draft_save_success", {
        user_id: user.id,
        draft_id: result.record.draftId,
        tag_id: value.tagId,
      });
      setActiveDraftId(result.record.draftId);
      router.push("/drafts");
    }
  };

  return (
    <AppShell
      title="Create Ranking"
      subtitle="Create or save draft. This corresponds to mock 03."
    >
      <RankingForm
        key={activeDraftId ?? "new"}
        initialValue={initialDraft}
        submitLabel="Create"
        onSubmit={handlePublish}
        onSaveDraft={handleSaveDraft}
        onCancel={() => router.push("/rankings")}
        autosaveKey={user ? `${user.id}:${activeDraftId ?? "new"}` : undefined}
      />
    </AppShell>
  );
}
