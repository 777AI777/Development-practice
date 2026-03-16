import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getReadings } from "./yahoo-furigana";

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal("fetch", mockFetch);
  vi.stubEnv("YAHOO_CLIENT_ID", "test-client-id");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("getReadings", () => {
  it("returns katakana readings for kanji input", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "1",
        jsonrpc: "2.0",
        result: {
          word: [
            { surface: "映画", furigana: "えいが", roman: "eiga" },
          ],
        },
      }),
    });

    const readings = await getReadings("映画");
    expect(readings).toEqual(["エイガ"]);
  });

  it("returns katakana readings for multi-word input", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "1",
        jsonrpc: "2.0",
        result: {
          word: [
            { surface: "化粧", furigana: "けしょう", roman: "keshou" },
            { surface: "品", furigana: "ひん", roman: "hin" },
          ],
        },
      }),
    });

    const readings = await getReadings("化粧品");
    expect(readings).toEqual(["ケショウヒン"]);
  });

  it("returns katakana reading for katakana input", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "1",
        jsonrpc: "2.0",
        result: {
          word: [
            { surface: "カフェ", furigana: "かふぇ", roman: "kafe" },
          ],
        },
      }),
    });

    const readings = await getReadings("カフェ");
    expect(readings).toEqual(["カフェ"]);
  });

  it("returns empty array when YAHOO_CLIENT_ID is not set", async () => {
    vi.stubEnv("YAHOO_CLIENT_ID", "");

    const readings = await getReadings("映画");
    expect(readings).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns empty array on API error response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    const readings = await getReadings("映画");
    expect(readings).toEqual([]);
  });

  it("returns empty array on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const readings = await getReadings("映画");
    expect(readings).toEqual([]);
  });

  it("sends correct request to Yahoo API", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "1",
        jsonrpc: "2.0",
        result: {
          word: [
            { surface: "映画", furigana: "えいが", roman: "eiga" },
          ],
        },
      }),
    });

    await getReadings("映画");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://jlp.yahooapis.jp/FuriganaService/V2/furigana",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "User-Agent": "Yahoo AppID: test-client-id",
        }),
      }),
    );
  });

  it("sends correct JSON-RPC body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "1",
        jsonrpc: "2.0",
        result: {
          word: [{ surface: "旅行", furigana: "りょこう", roman: "ryokou" }],
        },
      }),
    });

    await getReadings("旅行");

    const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(calledBody).toEqual({
      id: "1",
      jsonrpc: "2.0",
      method: "jlp.furiganaservice.furigana",
      params: { q: "旅行", grade: 1 },
    });
  });

  it("handles words without furigana field", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "1",
        jsonrpc: "2.0",
        result: {
          word: [
            { surface: "DIY" },
          ],
        },
      }),
    });

    const readings = await getReadings("DIY");
    expect(readings).toEqual(["DIY"]);
  });

  it("returns empty array when result has no words", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "1",
        jsonrpc: "2.0",
        result: {
          word: [],
        },
      }),
    });

    const readings = await getReadings("");
    expect(readings).toEqual([]);
  });
});
