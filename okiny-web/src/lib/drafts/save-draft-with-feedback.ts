import { DraftLimitError } from "@/lib/drafts/draft-errors";
import type {
  DraftRepository,
  DraftSaveInput,
} from "@/lib/drafts/draft-repository";
import type { DraftLocalRecord, ToastMessage } from "@/lib/types";

export type SaveDraftResult =
  | { ok: true; record: DraftLocalRecord; toast: ToastMessage }
  | { ok: false; toast: ToastMessage };

export async function saveDraftWithFeedback(
  repository: DraftRepository,
  userId: string,
  input: DraftSaveInput,
): Promise<SaveDraftResult> {
  try {
    const record = await repository.save(userId, input);
    return {
      ok: true,
      record,
      toast: { type: "success", message: "下書きを保存しました。" },
    };
  } catch (error) {
    if (error instanceof DraftLimitError) {
      return {
        ok: false,
        toast: { type: "warning", message: "下書き上限に達しています（最大5件）" },
      };
    }

    return {
      ok: false,
      toast: {
        type: "error",
        message: "下書き保存に失敗しました。ブラウザ設定を確認してください。",
        persistent: true,
      },
    };
  }
}

