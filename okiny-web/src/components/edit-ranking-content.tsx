"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { usePageTransition } from "@/components/page-transition-provider";
import { RankingForm } from "@/components/ranking-form";
import { useToast } from "@/components/toast-provider";
import { autosaveRepository } from "@/lib/autosave/client-repository";
import { publishedApiClient } from "@/lib/publish/client";
import { PublishedApiError } from "@/lib/publish/http-published-api-client";
import { useSessionUser } from "@/hooks/use-session-user";
import type { PublishedRanking, RankingInput, RankingItems } from "@/lib/types";

function toRankingItems(items: string[]): RankingItems {
  return [items[0] ?? "", items[1] ?? "", items[2] ?? "", items[3] ?? "", items[4] ?? ""];
}

interface EditRankingContentProps {
  ranking: PublishedRanking;
}

export function EditRankingContent({ ranking }: EditRankingContentProps) {
  const router = useRouter();
  const { user } = useSessionUser();
  const { pushToast } = useToast();
  const { signalReady } = usePageTransition();
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreDecided, setRestoreDecided] = useState(false);
  const [overrideValue, setOverrideValue] = useState<RankingInput | undefined>();
  const [overrideTagName, setOverrideTagName] = useState<string | undefined>();
  const [overrideNewTagName, setOverrideNewTagName] = useState<string | undefined>();

  const rankingId = ranking.id;
  const autosaveKey = `edit:${rankingId}`;
  const expectedUpdatedAt = ranking.updatedAt;

  useEffect(() => {
    if (!user || restoreDecided) {
      if (!user) signalReady();
      return;
    }
    void (async () => {
      const hasAutosave = await autosaveRepository.has(user.id, autosaveKey);
      if (hasAutosave) {
        setRestoreDialogOpen(true);
      } else {
        setRestoreDecided(true);
      }
      signalReady();
    })();
  }, [autosaveKey, restoreDecided, signalReady, user]);

  const handleRestoreConfirm = () => {
    if (!user) return;
    void (async () => {
      const record = await autosaveRepository.get(user.id, autosaveKey);
      if (record) {
        setOverrideValue({
          title: record.title,
          tagId: record.tagId,
          items: toRankingItems([...record.items]),
          isPublic: record.isPublic ?? true,
        });
        setOverrideTagName(record.selectedTagName);
        setOverrideNewTagName(record.newTagName);
      }
      setRestoreDecided(true);
      setRestoreDialogOpen(false);
    })();
  };

  const handleRestoreCancel = () => {
    if (!user) return;
    void (async () => {
      await autosaveRepository.delete(user.id, autosaveKey);
      setRestoreDecided(true);
      setRestoreDialogOpen(false);
    })();
  };

  const initialValue: RankingInput = overrideValue ?? {
    title: ranking.title,
    tagId: ranking.tagId,
    items: ranking.items,
    isPublic: ranking.isPublic ?? true,
  };

  const initialTagName = overrideTagName ?? ranking.tagName;
  const initialNewTagName = overrideNewTagName;

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
      router.replace(`/rankings/${rankingId}`);
    } catch (error: unknown) {
      const message =
        error instanceof PublishedApiError
          ? error.message
          : "ランキングの更新に失敗しました。";
      pushToast({ type: "error", message, persistent: true });
    }
  };

  const autosaveConfig = useMemo(
    () => user && restoreDecided
      ? { userId: user.id, key: autosaveKey }
      : undefined,
    [user, restoreDecided, autosaveKey],
  );

  return (
    <AppShell>
      <RankingForm
        key={restoreDecided ? "ready" : "pending"}
        initialValue={initialValue}
        initialTagName={initialTagName}
        initialNewTagName={initialNewTagName}
        submitLabel="更新"
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        onBack={() => router.back()}
        autosaveConfig={autosaveConfig}
      />
      <ConfirmDialog
        open={restoreDialogOpen}
        onConfirm={handleRestoreConfirm}
        onCancel={handleRestoreCancel}
        title="前回編集時の内容が残っています。復元しますか？"
        confirmLabel="復元"
        cancelLabel="破棄"
      />
    </AppShell>
  );
}
