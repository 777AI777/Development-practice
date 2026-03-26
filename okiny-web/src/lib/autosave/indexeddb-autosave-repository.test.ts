import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import {
  __resetAutosaveDbForTests,
  IndexedDbAutosaveRepository,
} from "@/lib/autosave/indexeddb-autosave-repository";

function makeInput(seed: string) {
  return {
    title: `${seed}-title`,
    tagId: `${seed}-tag`,
    items: [`${seed}-1`, `${seed}-2`, `${seed}-3`, `${seed}-4`, `${seed}-5`],
  };
}

describe("IndexedDbAutosaveRepository", () => {
  beforeEach(async () => {
    await __resetAutosaveDbForTests();
  });

  it("returns undefined for a non-existent key", async () => {
    const repository = new IndexedDbAutosaveRepository();
    const result = await repository.get("user-a", "new");
    expect(result).toBeUndefined();
  });

  it("saves and retrieves an autosave record", async () => {
    const repository = new IndexedDbAutosaveRepository();
    await repository.save("user-a", "new", makeInput("movie"));

    const result = await repository.get("user-a", "new");
    expect(result).toBeDefined();
    expect(result?.title).toBe("movie-title");
    expect(result?.tagId).toBe("movie-tag");
    expect(result?.items).toEqual([
      "movie-1",
      "movie-2",
      "movie-3",
      "movie-4",
      "movie-5",
    ]);
    expect(result?.userId).toBe("user-a");
    expect(result?.key).toBe("new");
    expect(result?.updatedAt).toBeDefined();
  });

  it("overwrites an existing record with the same key", async () => {
    const repository = new IndexedDbAutosaveRepository();
    await repository.save("user-a", "new", makeInput("first"));
    await repository.save("user-a", "new", makeInput("second"));

    const result = await repository.get("user-a", "new");
    expect(result?.title).toBe("second-title");
  });

  it("returns undefined after deleting a record", async () => {
    const repository = new IndexedDbAutosaveRepository();
    await repository.save("user-a", "new", makeInput("movie"));
    await repository.delete("user-a", "new");

    const result = await repository.get("user-a", "new");
    expect(result).toBeUndefined();
  });

  it("has() returns true for an existing key", async () => {
    const repository = new IndexedDbAutosaveRepository();
    await repository.save("user-a", "new", makeInput("movie"));

    const exists = await repository.has("user-a", "new");
    expect(exists).toBe(true);
  });

  it("has() returns false for a non-existent key", async () => {
    const repository = new IndexedDbAutosaveRepository();
    const exists = await repository.has("user-a", "new");
    expect(exists).toBe(false);
  });

  it("isolates records by userId", async () => {
    const repository = new IndexedDbAutosaveRepository();
    await repository.save("user-a", "new", makeInput("a-data"));
    await repository.save("user-b", "new", makeInput("b-data"));

    const resultA = await repository.get("user-a", "new");
    const resultB = await repository.get("user-b", "new");

    expect(resultA?.title).toBe("a-data-title");
    expect(resultB?.title).toBe("b-data-title");
  });

  it("does not allow user-b to read user-a's record", async () => {
    const repository = new IndexedDbAutosaveRepository();
    await repository.save("user-a", "edit:ranking-1", makeInput("secret"));

    const result = await repository.get("user-b", "edit:ranking-1");
    expect(result).toBeUndefined();
  });

  it("does not allow user-b to delete user-a's record", async () => {
    const repository = new IndexedDbAutosaveRepository();
    await repository.save("user-a", "new", makeInput("protected"));
    await repository.delete("user-b", "new");

    const result = await repository.get("user-a", "new");
    expect(result).toBeDefined();
    expect(result?.title).toBe("protected-title");
  });

  it("handles different key types independently", async () => {
    const repository = new IndexedDbAutosaveRepository();
    await repository.save("user-a", "new", makeInput("new-data"));
    await repository.save("user-a", "draft:abc", makeInput("draft-data"));
    await repository.save("user-a", "edit:xyz", makeInput("edit-data"));

    const newRecord = await repository.get("user-a", "new");
    const draftRecord = await repository.get("user-a", "draft:abc");
    const editRecord = await repository.get("user-a", "edit:xyz");

    expect(newRecord?.title).toBe("new-data-title");
    expect(draftRecord?.title).toBe("draft-data-title");
    expect(editRecord?.title).toBe("edit-data-title");
  });

  it("preserves optional fields when saved", async () => {
    const repository = new IndexedDbAutosaveRepository();
    await repository.save("user-a", "new", {
      ...makeInput("tag-test"),
      newTagName: "custom-tag",
      selectedTagName: "selected-tag",
    });

    const result = await repository.get("user-a", "new");
    expect(result?.newTagName).toBe("custom-tag");
    expect(result?.selectedTagName).toBe("selected-tag");
  });

  it("persists data across repository instances", async () => {
    const repositoryA = new IndexedDbAutosaveRepository();
    await repositoryA.save("user-a", "new", makeInput("persist"));

    const repositoryB = new IndexedDbAutosaveRepository();
    const result = await repositoryB.get("user-a", "new");
    expect(result?.title).toBe("persist-title");
  });

  it("has() returns false after deletion", async () => {
    const repository = new IndexedDbAutosaveRepository();
    await repository.save("user-a", "new", makeInput("temp"));
    await repository.delete("user-a", "new");

    const exists = await repository.has("user-a", "new");
    expect(exists).toBe(false);
  });
});
