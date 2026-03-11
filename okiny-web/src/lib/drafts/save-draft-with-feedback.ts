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
      toast: { type: "success", message: "Draft saved." },
    };
  } catch (error) {
    if (error instanceof DraftLimitError) {
      return {
        ok: false,
        toast: { type: "warning", message: "Draft limit reached (max 5)." },
      };
    }

    return {
      ok: false,
      toast: {
        type: "error",
        message: "Failed to save draft in local browser storage.",
        persistent: true,
      },
    };
  }
}

