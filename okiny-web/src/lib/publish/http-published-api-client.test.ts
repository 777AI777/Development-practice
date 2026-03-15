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

  it("succeeds when API returns 204 No Content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 })),
    );

    const client = new HttpPublishedApiClient();
    await expect(client.deletePublishedRanking("user-1", "ranking-1", "2025-01-01T00:00:00Z")).resolves.toBeUndefined();
  });

  it("throws PublishedApiError when delete response is not 204", async () => {
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
    await expect(client.deletePublishedRanking("user-1", "ranking-1", "2025-01-01T00:00:00Z")).rejects.toBeInstanceOf(
      PublishedApiError,
    );
  });

  it("throws PublishedApiError on 409 Conflict", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ error: { code: "CONFLICT", message: "Data has been updated." } }),
            { status: 409 },
          ),
      ),
    );

    const client = new HttpPublishedApiClient();
    const error = await client
      .deletePublishedRanking("user-1", "ranking-1", "2025-01-01T00:00:00Z")
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PublishedApiError);
    expect((error as PublishedApiError).code).toBe("CONFLICT");
  });
});
