import { describe, it, expect } from "vitest";
import { normalizeTagName, getTagLabelFromList } from "./tag-utils";

describe("normalizeTagName", () => {
  it("trims whitespace", () => {
    expect(normalizeTagName("  映画  ")).toBe("映画");
  });

  it("normalizes NFKC (fullwidth to halfwidth)", () => {
    expect(normalizeTagName("ＤＩＹ")).toBe("DIY");
  });

  it("preserves case (no lowercasing)", () => {
    expect(normalizeTagName("DIY")).toBe("DIY");
    expect(normalizeTagName("diy")).toBe("diy");
  });

  it("handles combined trim + NFKC", () => {
    expect(normalizeTagName("  ＤＩＹ  ")).toBe("DIY");
  });

  it("handles empty string after trim", () => {
    expect(normalizeTagName("   ")).toBe("");
  });

  it("handles katakana normalization", () => {
    // Halfwidth katakana → fullwidth katakana
    expect(normalizeTagName("ｶﾌｪ")).toBe("カフェ");
  });
});

describe("getTagLabelFromList", () => {
  const tags = [
    { id: "uuid-1", name: "映画" },
    { id: "uuid-2", name: "音楽" },
  ];

  it("returns tag name when found", () => {
    expect(getTagLabelFromList("uuid-1", tags)).toBe("映画");
  });

  it("returns tagId when not found", () => {
    expect(getTagLabelFromList("unknown-id", tags)).toBe("unknown-id");
  });

  it("handles empty list", () => {
    expect(getTagLabelFromList("uuid-1", [])).toBe("...");
  });
});
