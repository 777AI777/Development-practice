"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { usePageTransition } from "@/components/page-transition-provider";
import { RankingForm } from "@/components/ranking-form";
import { useToast } from "@/components/toast-provider";
import { useSessionUser } from "@/hooks/use-session-user";
import { trackEvent } from "@/lib/analytics";
import { autosaveRepository } from "@/lib/autosave/client-repository";
import { draftRepository } from "@/lib/drafts/client-repository";
import { saveDraftWithFeedback } from "@/lib/drafts/save-draft-with-feedback";
import { publishedApiClient } from "@/lib/publish/client";
import { publishRanking } from "@/lib/publish/publish-ranking";
import type { RankingInput, RankingItems } from "@/lib/types";

function toRankingItems(items: string[]): RankingItems {
  return [items[0] ?? "", items[1] ?? "", items[2] ?? "", items[3] ?? "", items[4] ?? ""];
}

const EMPTY_ITEMS: RankingItems = ["", "", "", "", ""];

function NewRankingPageContent() {
  const { signalReady } = usePageTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const { isReady, user } = useSessionUser();
  const [initialDraft, setInitialDraft] = useState<RankingInput | undefined>();
  const [initialTagName, setInitialTagName] = useState<string | undefined>();
  const [initialNewTagName, setInitialNewTagName] = useState<string | undefined>();
  const [activeDraftId, setActiveDraftId] = useState<string | undefined>();
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreDecided, setRestoreDecided] = useState(false);
  const autosaveKeyRef = useRef<string>("new");
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (!user) {
      signalReady();
      return;
    }
    if (restoreDecided) {
      return;
    }
    const draftId = searchParams.get("draftId");
    const preselectedTagId = searchParams.get("tagId");
    if (!draftId) {
      const key = "new";
      autosaveKeyRef.current = key;
      void (async () => {
        const hasAutosave = await autosaveRepository.has(user.id, key);
        if (hasAutosave && !preselectedTagId) {
          setRestoreDialogOpen(true);
        } else {
          setRestoreDecided(true);
        }
        if (preselectedTagId) {
          setInitialDraft({
            title: "",
            tagId: preselectedTagId,
            items: EMPTY_ITEMS,
          });
        } else {
          setInitialDraft(undefined);
        }
        setInitialTagName(undefined);
        setInitialNewTagName(undefined);
        setActiveDraftId(undefined);
        signalReady();
      })();
      return;
    }

    const draftAutosaveKey = `draft:${draftId}`;
    autosaveKeyRef.current = draftAutosaveKey;
    void (async () => {
      const hasAutosave = await autosaveRepository.has(user.id, draftAutosaveKey);
      if (hasAutosave) {
        setRestoreDialogOpen(true);
        signalReady();
        return;
      }

      try {
        const drafts = await draftRepository.list(user.id);
        const target = drafts.find((draft) => draft.draftId === draftId);
        if (!target) {
          signalReady();
          return;
        }
        setInitialDraft({
          title: target.title,
          tagId: target.tagId,
          items: toRankingItems([...target.items]),
        });
        setInitialTagName(target.selectedTagName);
        setInitialNewTagName(target.newTagName);
        setActiveDraftId(target.draftId);
        setRestoreDecided(true);
        signalReady();
      } catch {
        signalReady();
      }
    })();
  }, [isReady, restoreDecided, searchParams, signalReady, user]);

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

  const handleSaveDraft = async (value: RankingInput & { newTagName?: string; selectedTagName?: string }): Promise<boolean> => {
    if (!user) return false;
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
    }
    return result.ok;
  };

  const handleRestoreConfirm = () => {
    if (!user) return;
    const key = autosaveKeyRef.current;
    void (async () => {
      const record = await autosaveRepository.get(user.id, key);
      if (record) {
        setInitialDraft({
          title: record.title,
          tagId: record.tagId,
          items: toRankingItems([...record.items]),
        });
        setInitialTagName(record.selectedTagName);
        setInitialNewTagName(record.newTagName);
      }
      const draftId = searchParams.get("draftId");
      if (draftId) {
        setActiveDraftId(draftId);
      }
      setRestoreDecided(true);
      setRestoreDialogOpen(false);
    })();
  };

  const handleRestoreCancel = () => {
    if (!user) return;
    const key = autosaveKeyRef.current;
    void (async () => {
      await autosaveRepository.delete(user.id, key);
      const draftId = searchParams.get("draftId");
      if (draftId) {
        try {
          const drafts = await draftRepository.list(user.id);
          const target = drafts.find((draft) => draft.draftId === draftId);
          if (target) {
            setInitialDraft({
              title: target.title,
              tagId: target.tagId,
              items: toRankingItems([...target.items]),
            });
            setInitialTagName(target.selectedTagName);
            setInitialNewTagName(target.newTagName);
            setActiveDraftId(target.draftId);
          }
        } catch {
          // drafts store read failure — proceed with empty form
        }
      }
      setRestoreDecided(true);
      setRestoreDialogOpen(false);
    })();
  };

  const autosaveConfig = useMemo(
    () => user && restoreDecided
      ? { userId: user.id, key: activeDraftId ? `draft:${activeDraftId}` : "new" }
      : undefined,
    [user, restoreDecided, activeDraftId],
  );

  return (
    <AppShell>
      <RankingForm
        key={activeDraftId ?? "new"}
        initialValue={initialDraft}
        initialTagName={initialTagName}
        initialNewTagName={initialNewTagName}
        submitLabel="作成"
        onSubmit={handlePublish}
        onSaveDraft={handleSaveDraft}
        onDraftList={() => router.push("/drafts")}
        onCancel={() => router.back()}
        onBack={() => router.back()}
        autosaveConfig={autosaveConfig}
      />
      <ConfirmDialog
        open={restoreDialogOpen}
        onConfirm={handleRestoreConfirm}
        onCancel={handleRestoreCancel}
        title="前回の続きから作成しますか？"
        confirmLabel="復元する"
        cancelLabel="破棄して新規作成"
      />
    </AppShell>
  );
}

export default function NewRankingPage() {
  return (
    <Suspense fallback={null}>
      <NewRankingPageContent />
    </Suspense>
  );
}
