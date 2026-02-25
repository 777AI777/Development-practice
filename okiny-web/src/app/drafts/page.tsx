"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useToast } from "@/components/toast-provider";
import { SHOW_STATE_SCREENS } from "@/lib/features";
import { MAX_DRAFTS_PER_USER } from "@/lib/drafts/constants";
import { draftRepository } from "@/lib/drafts/client-repository";
import { publishRanking } from "@/lib/publish/publish-ranking";
import { publishedApiClient } from "@/lib/publish/client";
import { useSessionUser } from "@/hooks/use-session-user";
import type { DraftLocalRecord } from "@/lib/types";

export default function DraftsPage() {
  const { user } = useSessionUser();
  const { pushToast } = useToast();
  const [drafts, setDrafts] = useState<DraftLocalRecord[]>([]);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const loadDrafts = useCallback(async () => {
    if (!user) {
      return;
    }
    try {
      const data = await draftRepository.list(user.id);
      setDrafts(data);
    } catch {
      pushToast({
        type: "error",
        message: "ローカル下書きの読み込みに失敗しました。",
        persistent: true,
      });
    }
  }, [pushToast, user]);

  useEffect(() => {
    void loadDrafts();
  }, [loadDrafts]);

  const deleteDraft = async (draftId: string) => {
    if (!user) return;
    await draftRepository.delete(user.id, draftId);
    await loadDrafts();
    pushToast({ type: "info", message: "下書きを削除しました。" });
  };

  const publishDraft = async (draft: DraftLocalRecord) => {
    if (!user) return;
    setPublishingId(draft.draftId);
    const result = await publishRanking({
      userId: user.id,
      ranking: { title: draft.title, tagId: draft.tagId, items: draft.items },
      draftId: draft.draftId,
      draftRepository,
      apiClient: publishedApiClient,
    });
    setPublishingId(null);
    pushToast(result.toast);
    await loadDrafts();
  };

  return (
    <AppShell
      title="下書き一覧"
      subtitle="ユーザーごとのローカルブラウザ下書き一覧。モック06に対応。"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Link href="/rankings/new" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
            新規ランキング作成
          </Link>
          {SHOW_STATE_SCREENS ? (
            <Link href="/states/empty-drafts" className="rounded-md border border-slate-300 px-4 py-2 text-sm">
              空の下書き画面を開く (11)
            </Link>
          ) : null}
        </div>

        <p className="text-sm text-slate-600">
          下書き件数: {drafts.length}/{MAX_DRAFTS_PER_USER}
        </p>

        {drafts.length === 0 ? (
          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-600">ローカル下書きはありません。</p>
            <Link
              href="/rankings/new"
              className="inline-flex rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white"
            >
              ランキング作成
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {drafts.map((draft) => (
              <li key={draft.draftId} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="font-semibold text-slate-900">{draft.title || "（無題）"}</p>
                <p className="text-xs text-slate-600">タグ: {draft.tagId}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    href={`/rankings/new?draftId=${encodeURIComponent(draft.draftId)}`}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold"
                  >
                    編集
                  </Link>
                  <button
                    type="button"
                    onClick={() => void publishDraft(draft)}
                    disabled={publishingId === draft.draftId}
                    className="rounded-md bg-blue-700 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {publishingId === draft.draftId ? "公開中..." : "公開"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteDraft(draft.draftId)}
                    className="rounded-md border border-red-300 px-3 py-1 text-xs font-semibold text-red-700"
                  >
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
