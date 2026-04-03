import type { DraftRepository } from "@/lib/drafts/draft-repository";
import {
  HttpPublishedApiClient,
  PublishedApiError,
} from "@/lib/publish/http-published-api-client";
import { buildSessionExpiredToast } from "@/lib/session-expired-toast";
import type { PublishedRanking, RankingInput, ToastMessage } from "@/lib/types";

export type PublishRankingResult =
  | { ok: true; published: PublishedRanking; toast: ToastMessage; draftDeleteFailed?: boolean }
  | { ok: false; toast: ToastMessage };

function buildErrorToast(error: unknown): ToastMessage {
  if (error instanceof PublishedApiError) {
    if (error.code === "UNAUTHORIZED") {
      return buildSessionExpiredToast();
    }
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
  comment?: string;
  draftId?: string;
  draftRepository: DraftRepository;
  apiClient: HttpPublishedApiClient;
}): Promise<PublishRankingResult> {
  try {
    const published = await params.apiClient.createPublishedRanking({
      ranking: params.ranking,
      ...(params.comment ? { comment: params.comment } : {}),
    });

    let draftDeleteFailed = false;
    if (params.draftId) {
      try {
        await params.draftRepository.delete(params.userId, params.draftId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.warn("[publish-ranking] Failed to delete draft after publish:", message);
        draftDeleteFailed = true;
      }
    }

    return {
      ok: true,
      published,
      toast: { type: "success", message: "ランキングを公開しました。" },
      ...(draftDeleteFailed ? { draftDeleteFailed: true } : {}),
    };
  } catch (error) {
    return { ok: false, toast: buildErrorToast(error) };
  }
}
