import { afterEach, describe, expect, it, vi } from "vitest";

import {
  HttpPublishedApiClient,
  PublishedApiError,
} from "@/lib/publish/http-published-api-client";

describe("HttpPublishedApiClient.deletePublishedRanking", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("succeeds when API returns wrapped delete response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ data: { ok: true } }), { status: 200 })),
    );

    const client = new HttpPublishedApiClient();
    await expect(client.deletePublishedRanking("user-1", "ranking-1")).resolves.toBeUndefined();
  });

  it("succeeds when API returns legacy delete response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })));

    const client = new HttpPublishedApiClient();
    await expect(client.deletePublishedRanking("user-1", "ranking-1")).resolves.toBeUndefined();
  });

  it("throws PublishedApiError when delete response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ error: { code: "SERVER", message: "Failed to delete ranking." } }),
            { status: 500 },
          ),
      ),
    );

    const client = new HttpPublishedApiClient();
    await expect(client.deletePublishedRanking("user-1", "ranking-1")).rejects.toBeInstanceOf(
      PublishedApiError,
    );
  });
});
