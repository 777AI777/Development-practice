"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useToast } from "@/components/toast-provider";
import { MAX_DRAFTS_PER_USER } from "@/lib/drafts/constants";
import { IndexedDbDraftRepository } from "@/lib/drafts/indexeddb-draft-repository";
import { saveDraftWithFeedback } from "@/lib/drafts/save-draft-with-feedback";
import { MOCK_USERS } from "@/lib/mock-users";
import { HttpPublishedApiClient } from "@/lib/publish/http-published-api-client";
import { publishRanking } from "@/lib/publish/publish-ranking";
import { FIXED_TAGS } from "@/lib/tags";
import type { DraftLocalRecord, PublishedRanking, RankingItems } from "@/lib/types";

const DRAFT_NOTICE_STORAGE_KEY = "okiny:draft-local-notice-seen";

const draftRepository = new IndexedDbDraftRepository();
const publishedApiClient = new HttpPublishedApiClient();

interface RankingFormState {
  title: string;
  tagId: string;
  items: RankingItems;
}

function createEmptyItems(): RankingItems {
  return ["", "", "", "", ""];
}

function createInitialFormState(): RankingFormState {
  return {
    title: "",
    tagId: FIXED_TAGS[0]?.id ?? "",
    items: createEmptyItems(),
  };
}

function toRankingItems(items: string[]): RankingItems {
  return [
    items[0] ?? "",
    items[1] ?? "",
    items[2] ?? "",
    items[3] ?? "",
    items[4] ?? "",
  ];
}

export default function Home() {
  const { pushToast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState(MOCK_USERS[0].id);
  const [drafts, setDrafts] = useState<DraftLocalRecord[]>([]);
  const [publishedRankings, setPublishedRankings] = useState<PublishedRanking[]>([]);
  const [formState, setFormState] = useState<RankingFormState>(createInitialFormState);
  const [activeDraftId, setActiveDraftId] = useState<string | undefined>();
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishingDraftId, setPublishingDraftId] = useState<string | null>(null);
  const [showLocalDraftNotice, setShowLocalDraftNotice] = useState(false);

  const selectedUser = useMemo(
    () => MOCK_USERS.find((user) => user.id === selectedUserId) ?? MOCK_USERS[0],
    [selectedUserId],
  );

  const loadDrafts = useCallback(async () => {
    try {
      const localDrafts = await draftRepository.list(selectedUserId);
      setDrafts(localDrafts);
    } catch {
      pushToast({
        type: "error",
        message: "下書きの読み込みに失敗しました。",
        persistent: true,
      });
    }
  }, [pushToast, selectedUserId]);

  const loadPublishedRankings = useCallback(async () => {
    try {
      const rankings = await publishedApiClient.listPublishedRankings(selectedUserId);
      setPublishedRankings(rankings);
    } catch {
      pushToast({
        type: "error",
        message: "公開ランキングの読み込みに失敗しました。",
      });
    }
  }, [pushToast, selectedUserId]);

  useEffect(() => {
    void loadDrafts();
    void loadPublishedRankings();
  }, [loadDrafts, loadPublishedRankings]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!window.localStorage.getItem(DRAFT_NOTICE_STORAGE_KEY)) {
      setShowLocalDraftNotice(true);
    }
  }, []);

  const dismissDraftNotice = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DRAFT_NOTICE_STORAGE_KEY, "1");
    }
    setShowLocalDraftNotice(false);
  };

  const handleItemChange = (index: number, value: string) => {
    setFormState((previous) => {
      const nextItems = [...previous.items];
      nextItems[index] = value;
      return { ...previous, items: toRankingItems(nextItems) };
    });
  };

  const resetForm = () => {
    setFormState(createInitialFormState());
    setActiveDraftId(undefined);
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const result = await saveDraftWithFeedback(draftRepository, selectedUserId, {
        draftId: activeDraftId,
        title: formState.title,
        tagId: formState.tagId,
        items: formState.items,
      });

      pushToast(result.toast);
      if (result.ok) {
        setActiveDraftId(result.record.draftId);
      }
      await loadDrafts();
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async (input: {
    title: string;
    tagId: string;
    items: RankingItems;
    draftId?: string;
  }) => {
    setIsPublishing(true);
    const result = await publishRanking({
      userId: selectedUserId,
      ranking: {
        title: input.title,
        tagId: input.tagId,
        items: input.items,
      },
      draftId: input.draftId,
      apiClient: publishedApiClient,
      draftRepository,
    });
    pushToast(result.toast);

    if (result.ok) {
      if (input.draftId && activeDraftId === input.draftId) {
        resetForm();
      }
      await Promise.all([loadDrafts(), loadPublishedRankings()]);
    }

    setIsPublishing(false);
  };

  const handlePublishFromForm = async () => {
    await handlePublish({
      title: formState.title,
      tagId: formState.tagId,
      items: formState.items,
      draftId: activeDraftId,
    });
  };

  const handlePublishFromDraft = async (draft: DraftLocalRecord) => {
    setPublishingDraftId(draft.draftId);
    try {
      await handlePublish({
        title: draft.title,
        tagId: draft.tagId,
        items: draft.items,
        draftId: draft.draftId,
      });
    } finally {
      setPublishingDraftId(null);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await draftRepository.delete(selectedUserId, draftId);
      if (activeDraftId === draftId) {
        resetForm();
      }
      await loadDrafts();
      pushToast({ type: "info", message: "下書きを削除しました。" });
    } catch {
      pushToast({ type: "error", message: "下書き削除に失敗しました。", persistent: true });
    }
  };

  const loadDraftToForm = (draft: DraftLocalRecord) => {
    setFormState({
      title: draft.title,
      tagId: draft.tagId,
      items: draft.items,
    });
    setActiveDraftId(draft.draftId);
  };

  const isDraftLimitReached = drafts.length >= MAX_DRAFTS_PER_USER;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-6 lg:px-10">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <h1 className="text-2xl font-bold">OKINY Phase1 - Draft Local Save</h1>
          <p className="mt-2 text-sm text-slate-600">
            下書きは IndexedDB（このブラウザ内）で管理し、公開時のみサーバーへ保存します。
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-sm font-semibold text-slate-700" htmlFor="user-select">
              ログインユーザー（擬似）
            </label>
            <select
              id="user-select"
              value={selectedUserId}
              onChange={(event) => {
                setSelectedUserId(event.target.value);
                resetForm();
              }}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-[320px]"
            >
              {MOCK_USERS.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
        </header>

        {showLocalDraftNotice ? (
          <section className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                下書きはこのブラウザにのみ保存されます。他の端末・ブラウザには同期されません。
              </p>
              <button
                type="button"
                onClick={dismissDraftNotice}
                className="rounded-md border border-blue-300 bg-white px-3 py-1.5 font-semibold text-blue-800"
              >
                了解
              </button>
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">ランキング入力</h2>
                {activeDraftId ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    編集中の下書き: {activeDraftId.slice(0, 8)}
                  </span>
                ) : null}
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="title" className="mb-1 block text-sm font-semibold">
                    タイトル
                  </label>
                  <input
                    id="title"
                    value={formState.title}
                    onChange={(event) =>
                      setFormState((previous) => ({
                        ...previous,
                        title: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="例: 映画トップ5"
                  />
                </div>

                <div>
                  <label htmlFor="tag" className="mb-1 block text-sm font-semibold">
                    固定タグ
                  </label>
                  <select
                    id="tag"
                    value={formState.tagId}
                    onChange={(event) =>
                      setFormState((previous) => ({
                        ...previous,
                        tagId: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    {FIXED_TAGS.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.label}
                      </option>
                    ))}
                  </select>
                </div>

                <fieldset className="space-y-2">
                  <legend className="mb-2 text-sm font-semibold">1〜5位</legend>
                  {formState.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-6 text-sm font-bold">{index + 1}</span>
                      <input
                        value={item}
                        onChange={(event) => handleItemChange(index, event.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        placeholder={`${index + 1}位の項目`}
                      />
                    </div>
                  ))}
                </fieldset>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleSaveDraft()}
                  disabled={isSavingDraft}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingDraft ? "保存中..." : "下書き保存"}
                </button>
                <button
                  type="button"
                  onClick={() => void handlePublishFromForm()}
                  disabled={isPublishing}
                  className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPublishing ? "公開中..." : "公開保存"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold"
                >
                  クリア
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">下書き一覧（ローカル）</h2>
              <p className="mt-2 text-sm text-slate-600">
                {selectedUser.name} の下書き: {drafts.length}/{MAX_DRAFTS_PER_USER}
              </p>

              {isDraftLimitReached ? (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  下書き上限に達しています。公開または削除してから新規保存してください。
                </div>
              ) : null}

              {drafts.length === 0 ? (
                <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                  下書きはありません。
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {drafts.map((draft) => (
                    <li
                      key={draft.draftId}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <p className="font-semibold">{draft.title || "(タイトル未入力)"}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        タグ: {draft.tagId} | 更新:{" "}
                        {new Date(draft.updatedAt).toLocaleString("ja-JP")}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => loadDraftToForm(draft)}
                          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          onClick={() => void handlePublishFromDraft(draft)}
                          disabled={publishingDraftId === draft.draftId}
                          className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {publishingDraftId === draft.draftId ? "公開中..." : "公開"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteDraft(draft.draftId)}
                          className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700"
                        >
                          削除
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">公開済みランキング（サーバー）</h2>
              {publishedRankings.length === 0 ? (
                <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                  公開済みランキングはありません。
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {publishedRankings.map((ranking) => (
                    <li
                      key={ranking.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <p className="font-semibold">{ranking.title}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        タグ: {ranking.tagId} | 公開:{" "}
                        {new Date(ranking.createdAt).toLocaleString("ja-JP")}
                      </p>
                      <ol className="mt-2 list-inside list-decimal text-sm text-slate-700">
                        {ranking.items.map((item, index) => (
                          <li key={`${ranking.id}-${index}`}>{item}</li>
                        ))}
                      </ol>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
