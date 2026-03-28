"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { usePageTransition } from "@/components/page-transition-provider";
import { useToast } from "@/components/toast-provider";
import { DEMO_RANKING_ID } from "@/lib/demo-ranking";
import { publishedApiClient } from "@/lib/publish/client";
import { PublishedApiError } from "@/lib/publish/http-published-api-client";
import { buildSessionExpiredToast } from "@/lib/session-expired-toast";
import type { PublishedRanking } from "@/lib/types";

interface DeleteRankingContentProps {
  ranking: PublishedRanking;
}

export function DeleteRankingContent({ ranking }: DeleteRankingContentProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const { signalReady } = usePageTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    signalReady();
  }, [signalReady]);

  const runDelete = async () => {
    if (ranking.id === DEMO_RANKING_ID) {
      pushToast({ type: "info", message: "デモランキングは削除できません。" });
      router.push("/rankings");
      return;
    }

    setIsDeleting(true);
    try {
      await publishedApiClient.deletePublishedRanking(
        ranking.id,
        ranking.updatedAt,
      );
      pushToast({ type: "success", message: "ランキングを削除しました。" });
      router.push("/rankings");
    } catch (error: unknown) {
      if (error instanceof PublishedApiError && error.code === "UNAUTHORIZED") {
        pushToast(buildSessionExpiredToast());
        return;
      }
      const message =
        error instanceof PublishedApiError
          ? error.message
          : "ランキングの削除に失敗しました。";
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

          <p className="mt-2 text-sm font-medium text-foreground">
            {ranking.title}
          </p>

          <p className="mt-3 text-sm text-destructive">
            この操作は取り消せません
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={() => void runDelete()}
              disabled={isDeleting}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {isDeleting ? "削除中..." : "削除する"}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
