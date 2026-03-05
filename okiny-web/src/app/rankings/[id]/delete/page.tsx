"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string | undefined>();

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (!user) {
      return;
    }
    if (rankingId === DEMO_RANKING_ID) {
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
        setExpectedUpdatedAt(ranking.updatedAt);
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
      });

    return () => {
      canceled = true;
    };
  }, [isReady, pushToast, rankingId, user]);

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
        user.id,
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
    <AppShell
      title="削除確認"
      subtitle="モック08の削除確認画面です。"
    >
      <div className="space-y-4">
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          このランキングを削除すると元に戻せません。
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void runDelete()}
            disabled={isDeleting || isLoading}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isDeleting ? "削除中..." : "完全に削除する"}
          </button>
          <Link
            href={`/rankings/${rankingId}`}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold"
          >
            キャンセル
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
