import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import { MAX_DRAFTS_PER_USER } from "@/lib/drafts/constants";
import { DraftLimitError } from "@/lib/drafts/draft-errors";
import {
  __resetDraftDbForTests,
  IndexedDbDraftRepository,
} from "@/lib/drafts/indexeddb-draft-repository";
import type { RankingItems } from "@/lib/types";

function rankingItems(seed: string): RankingItems {
  return [
    `${seed}-1`,
    `${seed}-2`,
    `${seed}-3`,
    `${seed}-4`,
    `${seed}-5`,
  ];
}

describe("IndexedDbDraftRepository", () => {
  beforeEach(async () => {
    await __resetDraftDbForTests();
  });

  it("persists drafts across repository instances for the same user", async () => {
    const repositoryA = new IndexedDbDraftRepository();
    await repositoryA.save("user-a", {
      title: "映画トップ5",
      tagId: "movie",
      items: rankingItems("movie"),
    });

    const repositoryB = new IndexedDbDraftRepository();
    const drafts = await repositoryB.list("user-a");

    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.title).toBe("映画トップ5");
  });

  it("allows up to 5 drafts and rejects the 6th draft", async () => {
    const repository = new IndexedDbDraftRepository();

    for (let index = 0; index < MAX_DRAFTS_PER_USER; index += 1) {
      await repository.save("user-a", {
        title: `draft-${index}`,
        tagId: "movie",
        items: rankingItems(`item-${index}`),
      });
    }

    await expect(
      repository.save("user-a", {
        title: "draft-over-limit",
        tagId: "movie",
        items: rankingItems("overflow"),
      }),
    ).rejects.toBeInstanceOf(DraftLimitError);
  });

  it("isolates drafts by user id", async () => {
    const repository = new IndexedDbDraftRepository();

    await repository.save("user-a", {
      title: "a-only",
      tagId: "movie",
      items: rankingItems("a"),
    });

    await repository.save("user-b", {
      title: "b-only",
      tagId: "music",
      items: rankingItems("b"),
    });

    const aDrafts = await repository.list("user-a");
    const bDrafts = await repository.list("user-b");

    expect(aDrafts).toHaveLength(1);
    expect(aDrafts[0]?.title).toBe("a-only");
    expect(bDrafts).toHaveLength(1);
    expect(bDrafts[0]?.title).toBe("b-only");
  });
});

