"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

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
  const { user } = useSessionUser();
  const { pushToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const runDelete = async () => {
    if (!user) return;
    if (rankingId === DEMO_RANKING_ID) {
      pushToast({ type: "info", message: "デモランキングは削除できません。" });
      router.push("/rankings");
      return;
    }

    setIsDeleting(true);
    try {
      await publishedApiClient.deletePublishedRanking(user.id, rankingId);
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
            disabled={isDeleting}
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

