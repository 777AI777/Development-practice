import { describe, expect, it } from "vitest";

import { DraftLimitError } from "@/lib/drafts/draft-errors";
import type { DraftRepository } from "@/lib/drafts/draft-repository";
import { saveDraftWithFeedback } from "@/lib/drafts/save-draft-with-feedback";
import type { RankingItems } from "@/lib/types";

function items(): RankingItems {
  return ["1", "2", "3", "4", "5"];
}

describe("saveDraftWithFeedback", () => {
  it("returns warning toast when draft limit is reached", async () => {
    const repository: DraftRepository = {
      list: async () => [],
      save: async () => {
        throw new DraftLimitError();
      },
      delete: async () => {},
      count: async () => 5,
    };

    const result = await saveDraftWithFeedback(repository, "user-1", {
      title: "title",
      tagId: "movie",
      items: items(),
      isPublic: true,
    });

    expect(result.ok).toBe(false);
    expect(result.toast.type).toBe("warning");
  });

  it("returns persistent error toast when storage throws unknown error", async () => {
    const repository: DraftRepository = {
      list: async () => [],
      save: async () => {
        throw new Error("idb failed");
      },
      delete: async () => {},
      count: async () => 0,
    };

    const result = await saveDraftWithFeedback(repository, "user-1", {
      title: "title",
      tagId: "movie",
      items: items(),
      isPublic: true,
    });

    expect(result.ok).toBe(false);
    expect(result.toast.type).toBe("error");
    expect(result.toast.persistent).toBe(true);
  });
});

