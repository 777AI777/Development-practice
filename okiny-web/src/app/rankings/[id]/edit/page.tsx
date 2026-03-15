"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { usePageTransition } from "@/components/page-transition-provider";
import { RankingForm } from "@/components/ranking-form";
import { useToast } from "@/components/toast-provider";
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
  const { signalReady } = usePageTransition();

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
      signalReady();
      return;
    }

    let canceled = false;
    setIsLoading(true);
    void publishedApiClient
      .getPublishedRanking(rankingId)
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
        signalReady();
      });

    return () => {
      canceled = true;
    };
  }, [isReady, pushToast, rankingId, signalReady, user]);

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

  return (
    <AppShell>
      {isLoading ? null : initialValue ? (
        <RankingForm
          initialValue={initialValue}
          submitLabel="更新"
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/rankings/${rankingId}`)}
          onBack={() => router.push(`/rankings/${rankingId}`)}
          autosaveKey={user ? `${user.id}:edit:${rankingId}` : undefined}
        />
      ) : (
        <p className="text-sm text-muted-foreground">データがありません。</p>
      )}
    </AppShell>
  );
}
