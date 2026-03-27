import { describe, expect, it } from "vitest";

import {
  buildUserProfilePath,
  isValidDisplayUserId,
  isValidUserProfileIdentifier,
  normalizeDisplayUserId,
  parseDisplayUserIdSearchQuery,
  toUserProfileLookup,
} from "@/lib/user-utils";

describe("normalizeDisplayUserId", () => {
  it("trims and lowercases the value", () => {
    expect(normalizeDisplayUserId("  Alice_01  ")).toBe("alice_01");
  });
});

describe("isValidDisplayUserId", () => {
  it("accepts lowercase letters, digits, and underscores", () => {
    expect(isValidDisplayUserId("alice_01")).toBe(true);
  });

  it("rejects hyphenated values", () => {
    expect(isValidDisplayUserId("alice-01")).toBe(false);
  });

  it("rejects values that are too short", () => {
    expect(isValidDisplayUserId("ab")).toBe(false);
  });
});

describe("isValidUserProfileIdentifier", () => {
  it("accepts UUIDs", () => {
    expect(
      isValidUserProfileIdentifier("123e4567-e89b-12d3-a456-426614174000"),
    ).toBe(true);
  });

  it("accepts display user IDs", () => {
    expect(isValidUserProfileIdentifier("alice_01")).toBe(true);
  });

  it("rejects arbitrary strings", () => {
    expect(isValidUserProfileIdentifier("Alice Smith")).toBe(false);
  });
});

describe("toUserProfileLookup", () => {
  it("returns an id lookup for UUIDs", () => {
    expect(
      toUserProfileLookup("123e4567-e89b-12d3-a456-426614174000"),
    ).toEqual({
      column: "id",
      value: "123e4567-e89b-12d3-a456-426614174000",
    });
  });

  it("returns a display_user_id lookup for custom IDs", () => {
    expect(toUserProfileLookup("Alice_01")).toEqual({
      column: "display_user_id",
      value: "alice_01",
    });
  });
});

describe("buildUserProfilePath", () => {
  it("prefers the display user ID when present", () => {
    expect(
      buildUserProfilePath({
        id: "123e4567-e89b-12d3-a456-426614174000",
        displayUserId: "alice_01",
      }),
    ).toBe("/users/alice_01");
  });

  it("falls back to the UUID when no display user ID exists", () => {
    expect(
      buildUserProfilePath({
        id: "123e4567-e89b-12d3-a456-426614174000",
        displayUserId: null,
      }),
    ).toBe("/users/123e4567-e89b-12d3-a456-426614174000");
  });
});

describe("parseDisplayUserIdSearchQuery", () => {
  it("extracts a valid @user_id search query", () => {
    expect(parseDisplayUserIdSearchQuery("@Alice_01")).toBe("alice_01");
  });

  it("returns null for normal tag searches", () => {
    expect(parseDisplayUserIdSearchQuery("anime")).toBeNull();
  });
});
