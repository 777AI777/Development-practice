import { describe, it, expect } from "vitest";
import { tagNameSchema, containsBannedWord, BANNED_WORDS } from "./tag-validation";

describe("tagNameSchema", () => {
  it("accepts valid tag name", () => {
    const result = tagNameSchema.safeParse("映画");
    expect(result.success).toBe(true);
  });

  it("accepts 20 character tag name", () => {
    const result = tagNameSchema.safeParse("あ".repeat(20));
    expect(result.success).toBe(true);
  });

  it("rejects empty string", () => {
    const result = tagNameSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects string over 20 characters", () => {
    const result = tagNameSchema.safeParse("あ".repeat(21));
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only string", () => {
    const result = tagNameSchema.safeParse("   ");
    expect(result.success).toBe(false);
  });

  it("trims and normalizes before validation", () => {
    const result = tagNameSchema.safeParse("  映画  ");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("映画");
    }
  });

  it("NFKC normalizes before validation", () => {
    const result = tagNameSchema.safeParse("ＤＩＹ");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("DIY");
    }
  });
});

describe("containsBannedWord", () => {
  it("returns true for banned word", () => {
    if (BANNED_WORDS.length > 0) {
      expect(containsBannedWord(BANNED_WORDS[0])).toBe(true);
    }
  });

  it("returns false for normal word", () => {
    expect(containsBannedWord("映画")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(containsBannedWord("")).toBe(false);
  });
});

describe("BANNED_WORDS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(BANNED_WORDS)).toBe(true);
    expect(BANNED_WORDS.length).toBeGreaterThan(0);
  });

  it("contains only strings", () => {
    for (const word of BANNED_WORDS) {
      expect(typeof word).toBe("string");
    }
  });
});
