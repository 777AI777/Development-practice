import type { DraftRepository } from "@/lib/drafts/draft-repository";
import { PublishedApiError } from "@/lib/publish/http-published-api-client";
import type { PublishedApiClient } from "@/lib/publish/http-published-api-client";
import type { PublishedRanking, RankingInput, ToastMessage } from "@/lib/types";

export type PublishRankingResult =
  | { ok: true; published: PublishedRanking; toast: ToastMessage }
  | { ok: false; toast: ToastMessage };

function toToastFromPublishError(error: unknown): ToastMessage {
  if (error instanceof PublishedApiError) {
    const defaultMessageByCode: Partial<Record<typeof error.code, string>> = {
      NETWORK: "通信エラーが発生しました。時間をおいて再試行してください。",
      VALIDATION: "入力内容を確認してください。",
      UNAUTHORIZED: "再ログインが必要です。",
      FORBIDDEN: "この操作は許可されていません。",
      RATE_LIMIT: "操作回数が上限です。しばらく待って再試行してください。",
      SERVER: "サーバーで問題が発生しました。",
      NOT_FOUND: "対象データが見つかりません。",
    };

    return {
      type: "error",
      message: error.message || defaultMessageByCode[error.code] || "公開に失敗しました。",
      persistent: error.code === "SERVER",
    };
  }

  return {
    type: "error",
    message: "公開に失敗しました。時間をおいて再試行してください。",
    persistent: true,
  };
}

interface PublishRankingParams {
  userId: string;
  ranking: RankingInput;
  draftId?: string;
  draftRepository: DraftRepository;
  apiClient: PublishedApiClient;
}

export async function publishRanking(
  params: PublishRankingParams,
): Promise<PublishRankingResult> {
  try {
    const published = await params.apiClient.createPublishedRanking({
      userId: params.userId,
      ranking: params.ranking,
    });

    if (params.draftId) {
      await params.draftRepository.delete(params.userId, params.draftId);
    }

    return {
      ok: true,
      published,
      toast: { type: "success", message: "公開しました。" },
    };
  } catch (error) {
    return { ok: false, toast: toToastFromPublishError(error) };
  }
}
