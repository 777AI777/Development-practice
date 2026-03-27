import { describe, it, expect } from "vitest";
import { isFormEmpty } from "./is-form-empty";
import type { RankingInput } from "../types";

const EMPTY_ITEMS: RankingInput["items"] = ["", "", "", "", ""];

function makeForm(overrides: Partial<RankingInput> = {}): RankingInput {
  return {
    title: "",
    tagId: "",
    items: EMPTY_ITEMS,
    isPublic: true,
    ...overrides,
  };
}

describe("isFormEmpty", () => {
  // 1. 全フィールド空 → true
  it("returns true when all fields are empty", () => {
    expect(isFormEmpty(makeForm())).toBe(true);
  });

  // 2. titleのみ入力 → false
  it("returns false when only title is filled", () => {
    expect(isFormEmpty(makeForm({ title: "My Ranking" }))).toBe(false);
  });

  // 3. itemsの1つだけ入力 → false
  it("returns false when one item is filled", () => {
    expect(
      isFormEmpty(makeForm({ items: ["First", "", "", "", ""] }))
    ).toBe(false);
  });

  // 4. tagIdのみ入力 → false
  it("returns false when only tagId is filled", () => {
    expect(
      isFormEmpty(makeForm({ tagId: "some-uuid-here" }))
    ).toBe(false);
  });

  // 5. newTagNameのみ入力 → false
  it("returns false when only newTagName is filled", () => {
    expect(isFormEmpty(makeForm(), "New Tag")).toBe(false);
  });

  // 6. スペースのみ入力（trim後空） → true
  it("returns true when fields contain only whitespace", () => {
    expect(
      isFormEmpty(
        makeForm({
          title: "   ",
          items: ["  ", " ", "　", "\t", "\n"],
        }),
        "   "
      )
    ).toBe(true);
  });

  // 7. 全フィールド入力 → false
  it("returns false when all fields are filled", () => {
    expect(
      isFormEmpty(
        makeForm({
          title: "Best Movies",
          tagId: "tag-uuid",
          items: ["Movie 1", "Movie 2", "Movie 3", "Movie 4", "Movie 5"],
        }),
        "movies"
      )
    ).toBe(false);
  });

  // Edge: newTagName が undefined → tagId空なら影響なし
  it("returns true when newTagName is undefined and form is otherwise empty", () => {
    expect(isFormEmpty(makeForm(), undefined)).toBe(true);
  });

  // Edge: items の途中だけ入力
  it("returns false when a middle item is filled", () => {
    expect(
      isFormEmpty(makeForm({ items: ["", "", "Third", "", ""] }))
    ).toBe(false);
  });

  // Edge: 最後の item だけ入力
  it("returns false when only the last item is filled", () => {
    expect(
      isFormEmpty(makeForm({ items: ["", "", "", "", "Fifth"] }))
    ).toBe(false);
  });
});
