"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { RankingForm } from "@/components/ranking-form";
import { useToast } from "@/components/toast-provider";
import { draftRepository } from "@/lib/drafts/client-repository";
import { saveDraftWithFeedback } from "@/lib/drafts/save-draft-with-feedback";
import { DEMO_RANKING, DEMO_RANKING_ID } from "@/lib/demo-ranking";
import { publishedApiClient } from "@/lib/publish/client";
import { PublishedApiError } from "@/lib/publish/http-published-api-client";
import { useSessionUser } from "@/hooks/use-session-user";
import type { RankingInput } from "@/lib/types";

export default function RankingEditPage() {
  const params = useParams<{ id: string }>();
  const rankingId = params.id;
  const router = useRouter();
  const { isReady, user } = useSessionUser();
  const { pushToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [initialValue, setInitialValue] = useState<RankingInput | undefined>();
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string | undefined>();

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (!user) {
      return;
    }
    if (rankingId === DEMO_RANKING_ID) {
      setInitialValue({
        title: DEMO_RANKING.title,
        tagId: DEMO_RANKING.tagId,
        items: DEMO_RANKING.items,
      });
      setExpectedUpdatedAt(undefined);
      setIsLoading(false);
      return;
    }

    let canceled = false;
    setIsLoading(true);
    void publishedApiClient
      .getPublishedRanking(user.id, rankingId)
      .then((ranking) => {
        if (canceled) return;
        setInitialValue({
          title: ranking.title,
          tagId: ranking.tagId,
          items: ranking.items,
        });
        setExpectedUpdatedAt(ranking.updatedAt);
      })
      .catch((error: unknown) => {
        if (canceled) return;
        const message =
          error instanceof PublishedApiError
            ? error.message
            : "編集用ランキングの読み込みに失敗しました。";
        pushToast({ type: "error", message });
      })
      .finally(() => {
        if (canceled) return;
        setIsLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [isReady, pushToast, rankingId, user]);

  const handleSubmit = async (value: RankingInput) => {
    if (!user) return;
    if (!expectedUpdatedAt) {
      pushToast({
        type: "error",
        message: "最新の更新日時が取得できませんでした。再読み込みしてください。",
      });
      return;
    }
    try {
      await publishedApiClient.updatePublishedRanking({
        userId: user.id,
        rankingId,
        ranking: value,
        expectedUpdatedAt,
      });
      pushToast({ type: "success", message: "ランキングを更新しました。" });
      router.push(`/rankings/${rankingId}`);
    } catch (error: unknown) {
      const message =
        error instanceof PublishedApiError
          ? error.message
          : "ランキングの更新に失敗しました。";
      pushToast({ type: "error", message, persistent: true });
    }
  };

  const handleSaveDraft = async (value: RankingInput) => {
    if (!user) return;
    const result = await saveDraftWithFeedback(draftRepository, user.id, {
      ...value,
      draftId: `edit-${rankingId}`,
    });
    pushToast(result.toast);
  };

  return (
    <AppShell
      title="ランキング編集"
      subtitle="作成/編集モック03の編集モード画面です。"
    >
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-10 animate-pulse rounded bg-slate-100" />
          <div className="h-56 animate-pulse rounded bg-slate-100" />
        </div>
      ) : initialValue ? (
        <RankingForm
          initialValue={initialValue}
          submitLabel="更新"
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          onCancel={() => router.push(`/rankings/${rankingId}`)}
          autosaveKey={user ? `${user.id}:edit:${rankingId}` : undefined}
        />
      ) : (
        <p className="text-sm text-slate-600">データがありません。</p>
      )}
    </AppShell>
  );
}
