import type { DraftRepository } from "@/lib/drafts/draft-repository";
import {
  HttpPublishedApiClient,
  PublishedApiError,
} from "@/lib/publish/http-published-api-client";
import type { PublishedRanking, RankingInput, ToastMessage } from "@/lib/types";

export type PublishRankingResult =
  | { ok: true; published: PublishedRanking; toast: ToastMessage }
  | { ok: false; toast: ToastMessage };

function buildErrorToast(error: unknown): ToastMessage {
  if (error instanceof PublishedApiError) {
    return {
      type: "error",
      message: error.message,
      persistent: error.code === "SERVER",
    };
  }
  return {
    type: "error",
    message: "Failed to publish ranking.",
    persistent: true,
  };
}

export async function publishRanking(params: {
  userId: string;
  ranking: RankingInput;
  draftId?: string;
  draftRepository: DraftRepository;
  apiClient: HttpPublishedApiClient;
}): Promise<PublishRankingResult> {
  try {
    const published = await params.apiClient.createPublishedRanking({
      ranking: params.ranking,
    });

    if (params.draftId) {
      await params.draftRepository.delete(params.userId, params.draftId);
    }

    return { ok: true, published, toast: { type: "success", message: "Published." } };
  } catch (error) {
    return { ok: false, toast: buildErrorToast(error) };
  }
}
