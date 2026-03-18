"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppShell } from "@/components/app-shell";
import { usePageTransition } from "@/components/page-transition-provider";
import { RankingForm } from "@/components/ranking-form";
import { useToast } from "@/components/toast-provider";
import { publishedApiClient } from "@/lib/publish/client";
import { PublishedApiError } from "@/lib/publish/http-published-api-client";
import { useSessionUser } from "@/hooks/use-session-user";
import type { PublishedRanking, RankingInput } from "@/lib/types";

interface EditRankingContentProps {
  ranking: PublishedRanking;
}

export function EditRankingContent({ ranking }: EditRankingContentProps) {
  const router = useRouter();
  const { user } = useSessionUser();
  const { pushToast } = useToast();
  const { signalReady } = usePageTransition();

  useEffect(() => {
    signalReady();
  }, [signalReady]);

  const rankingId = ranking.id;
  const expectedUpdatedAt = ranking.updatedAt;

  const initialValue: RankingInput = {
    title: ranking.title,
    tagId: ranking.tagId,
    items: ranking.items,
  };

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
      <RankingForm
        initialValue={initialValue}
        initialTagName={ranking.tagName}
        submitLabel="更新"
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/rankings/${rankingId}`)}
        onBack={() => router.push(`/rankings/${rankingId}`)}
        autosaveKey={user ? `${user.id}:edit:${rankingId}` : undefined}
      />
    </AppShell>
  );
}
