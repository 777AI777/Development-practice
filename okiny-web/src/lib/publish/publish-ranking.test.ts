import { describe, expect, it, vi } from "vitest";

import type { DraftRepository } from "@/lib/drafts/draft-repository";
import type { PublishedApiClient } from "@/lib/publish/http-published-api-client";
import { publishRanking } from "@/lib/publish/publish-ranking";
import type { DraftLocalRecord, RankingItems } from "@/lib/types";

function items(seed: string): RankingItems {
  return [`${seed}-1`, `${seed}-2`, `${seed}-3`, `${seed}-4`, `${seed}-5`];
}

const draftRepository: DraftRepository = {
  list: async () => [],
  save: async () =>
    ({
      draftId: "draft",
      userId: "user-1",
      title: "t",
      tagId: "movie",
      items: items("x"),
      isPublic: true,
      updatedAt: new Date().toISOString(),
    }) as DraftLocalRecord,
  delete: vi.fn(async () => {}),
  count: async () => 0,
};

describe("publishRanking", () => {
  it("deletes local draft after publish succeeds", async () => {
    const apiClient: PublishedApiClient = {
      listPublishedRankings: async () => [],
      listPublicRankingsByTag: async () => [],
      getPublishedRanking: async () => {
        throw new Error("not used in this test");
      },
      createPublishedRanking: async () => ({
        id: "published-1",
        userId: "user-1",
        title: "title",
        tagId: "movie",
        items: items("movie"),
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewCount: 0,
        bookmarkCount: 0,
      }),
      updatePublishedRanking: async (_input) => {
        throw new Error("not used in this test");
      },
      deletePublishedRanking: async (_rankingId, _expectedUpdatedAt) => {},
      createTag: async () => {
        throw new Error("not used in this test");
      },
      bookmarkRanking: async () => {},
      unbookmarkRanking: async () => {},
      recordView: async () => {},
    };

    const result = await publishRanking({
      userId: "user-1",
      ranking: {
        title: "title",
        tagId: "movie",
        items: items("movie"),
        isPublic: true,
      },
      draftId: "draft-1",
      draftRepository,
      apiClient,
    });

    expect(result.ok).toBe(true);
    expect(draftRepository.delete).toHaveBeenCalledWith("user-1", "draft-1");
  });
});
