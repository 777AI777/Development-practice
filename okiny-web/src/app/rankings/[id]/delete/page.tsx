"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { usePageTransition } from "@/components/page-transition-provider";
import { useToast } from "@/components/toast-provider";
import { DEMO_RANKING_ID } from "@/lib/demo-ranking";
import { publishedApiClient } from "@/lib/publish/client";
import { PublishedApiError } from "@/lib/publish/http-published-api-client";
import { useSessionUser } from "@/hooks/use-session-user";

export default function DeleteRankingPage() {
  const params = useParams<{ id: string }>();
  const rankingId = params.id;
  const router = useRouter();
  const { isReady, user } = useSessionUser();
  const { pushToast } = useToast();
  const { signalReady } = usePageTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string | undefined>();
  const [rankingTitle, setRankingTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (!user) {
      return;
    }
    if (rankingId === DEMO_RANKING_ID) {
      setExpectedUpdatedAt(undefined);
      setRankingTitle("デモランキング");
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
        setExpectedUpdatedAt(ranking.updatedAt);
        setRankingTitle(ranking.title);
      })
      .catch((error: unknown) => {
        if (canceled) return;
        const message =
          error instanceof PublishedApiError
            ? error.message
            : "ランキングの削除に必要な情報が取得できませんでした。";
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

  const runDelete = async () => {
    if (!user) return;
    if (rankingId === DEMO_RANKING_ID) {
      pushToast({ type: "info", message: "デモランキングは削除できません。" });
      router.push("/rankings");
      return;
    }

    setIsDeleting(true);
    try {
      if (!expectedUpdatedAt) {
        pushToast({
          type: "error",
          message: "最新の更新日時が取得できませんでした。再読み込みしてください。",
        });
        return;
      }
      await publishedApiClient.deletePublishedRanking(
        rankingId,
        expectedUpdatedAt,
      );
      pushToast({ type: "success", message: "ランキングを削除しました。" });
      router.push("/rankings");
    } catch (error: unknown) {
      const message =
        error instanceof PublishedApiError ? error.message : "ランキングの削除に失敗しました。";
      pushToast({ type: "error", message, persistent: true });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-3xl">
            {"\u26A0\uFE0F"}
          </div>

          <h1 className="mt-4 text-xl font-bold text-foreground">
            ランキングを削除しますか？
          </h1>

          {rankingTitle && (
            <p className="mt-2 text-sm font-medium text-foreground">
              {rankingTitle}
            </p>
          )}

          <p className="mt-3 text-sm text-destructive">
            この操作は取り消せません
          </p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => void runDelete()}
              disabled={isDeleting || isLoading}
              className="w-full rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {isDeleting ? "削除中..." : "削除する"}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/rankings/${rankingId}`)}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
