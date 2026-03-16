"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { usePageTransition } from "@/components/page-transition-provider";
import { useToast } from "@/components/toast-provider";
import { useSessionUser } from "@/hooks/use-session-user";
import { formatSmartDate } from "@/lib/format-date";
import { draftRepository } from "@/lib/drafts/client-repository";
import { MAX_DRAFTS_PER_USER } from "@/lib/drafts/constants";
import { publishedApiClient } from "@/lib/publish/client";
import { publishRanking } from "@/lib/publish/publish-ranking";
import type { DraftLocalRecord } from "@/lib/types";

export default function DraftsPage() {
  const { signalReady } = usePageTransition();
  const { isReady, user } = useSessionUser();
  const { pushToast } = useToast();
  const [drafts, setDrafts] = useState<DraftLocalRecord[]>([]);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const loadDrafts = useCallback(async () => {
    if (!user) return;
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
    if (!isReady) return;
    if (!user) {
      signalReady();
      return;
    }
    void loadDrafts().finally(() => signalReady());
  }, [isReady, loadDrafts, signalReady, user]);

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
    <AppShell>
      <div className="space-y-4">
        {/* Header: back + title */}
        <div className="flex items-center gap-2">
          <Link
            href="/rankings/new"
            className="flex h-8 w-8 items-center justify-center text-lg font-bold text-foreground"
            aria-label="戻る"
          >
            {"\u2190"}
          </Link>
          <h1 className="text-xl font-bold text-foreground">下書き一覧</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          下書き件数: {drafts.length}/{MAX_DRAFTS_PER_USER}
        </p>

        {drafts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              ローカル下書きはありません。
            </p>
            <Link
              href="/rankings/new"
              className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              ランキング作成
            </Link>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden bg-card">
            {drafts.map((draft, idx) => (
              <div
                key={draft.draftId}
                className="p-4"
                style={{ borderBottom: idx < drafts.length - 1 ? "1px solid var(--border)" : "none" }}
              >
                <Link
                  href={`/rankings/new?draftId=${encodeURIComponent(draft.draftId)}`}
                  className="block transition hover:opacity-80"
                >
                  <p className="font-semibold text-[15px] text-foreground">
                    {draft.title || "（無題）"}
                  </p>
                  <div className="mt-1 space-y-0">
                    {draft.items.slice(0, 5).map((item, itemIdx) => (
                      <p
                        key={`${draft.draftId}-item-${itemIdx}`}
                        className="text-sm leading-relaxed text-muted-foreground"
                      >
                        {itemIdx + 1}. {item.trim() ? item : "未入力"}
                      </p>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                      {draft.newTagName ?? draft.tagId}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      更新: {formatSmartDate(draft.updatedAt)}
                    </span>
                  </div>
                </Link>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void publishDraft(draft)}
                    disabled={publishingId === draft.draftId}
                    className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    {publishingId === draft.draftId ? "公開中..." : "公開"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteDraft(draft.draftId)}
                    className="rounded-lg border border-destructive/30 px-3 py-1 text-xs font-semibold text-destructive"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
