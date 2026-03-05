import type { AppErrorCode, PublishedRanking, RankingInput } from "@/lib/types";
import { getSessionUserId } from "@/lib/session";

interface ApiResponse<T> {
  data?: T;
  error?: {
    code?: AppErrorCode;
    message?: string;
  };
}

export class PublishedApiError extends Error {
  code: AppErrorCode;

  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "PublishedApiError";
  }
}

function mapStatusToErrorCode(status: number): AppErrorCode {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 409) return "CONFLICT";
  if (status === 404) return "NOT_FOUND";
  if (status === 422) return "VALIDATION";
  if (status === 429) return "RATE_LIMIT";
  return "SERVER";
}

function resolveUserId(userId?: string): string {
  const normalized = userId?.trim();
  if (normalized) {
    return normalized;
  }
  const fallback = getSessionUserId();
  if (fallback) {
    return fallback;
  }
  throw new PublishedApiError("VALIDATION", "userId is required.");
}

async function parseJson<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {};
  }
}

export interface PublishedApiClient {
  listPublishedRankings(userId: string, tagId?: string): Promise<PublishedRanking[]>;
  getPublishedRanking(userId: string, rankingId: string): Promise<PublishedRanking>;
  createPublishedRanking(input: {
    userId: string;
    ranking: RankingInput;
  }): Promise<PublishedRanking>;
  updatePublishedRanking(input: {
    userId: string;
    rankingId: string;
    ranking: RankingInput;
    expectedUpdatedAt: string;
  }): Promise<PublishedRanking>;
  deletePublishedRanking(userId: string, rankingId: string, expectedUpdatedAt: string): Promise<void>;
}

export class HttpPublishedApiClient implements PublishedApiClient {
  async listPublishedRankings(userId: string, tagId?: string): Promise<PublishedRanking[]> {
    const params = new URLSearchParams({ userId: resolveUserId(userId) });
    if (tagId) {
      params.set("tagId", tagId);
    }
    const response = await fetch(`/api/v1/rankings?${params.toString()}`, {
      cache: "no-store",
    });
    const body = await parseJson<PublishedRanking[]>(response);
    if (!response.ok || !body.data) {
      throw new PublishedApiError(
        body.error?.code ?? mapStatusToErrorCode(response.status),
        body.error?.message ?? "Failed to load rankings.",
      );
    }
    return body.data;
  }

  async getPublishedRanking(userId: string, rankingId: string): Promise<PublishedRanking> {
    const params = new URLSearchParams({ userId: resolveUserId(userId) });
    const response = await fetch(`/api/v1/rankings/${rankingId}?${params.toString()}`, {
      cache: "no-store",
    });
    const body = await parseJson<PublishedRanking>(response);
    if (!response.ok || !body.data) {
      throw new PublishedApiError(
        body.error?.code ?? mapStatusToErrorCode(response.status),
        body.error?.message ?? "Failed to load ranking.",
      );
    }
    return body.data;
  }

  async createPublishedRanking(input: {
    userId: string;
    ranking: RankingInput;
  }): Promise<PublishedRanking> {
    const response = await fetch("/api/v1/rankings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await parseJson<PublishedRanking>(response);
    if (!response.ok || !body.data) {
      throw new PublishedApiError(
        body.error?.code ?? mapStatusToErrorCode(response.status),
        body.error?.message ?? "Failed to create ranking.",
      );
    }
    return body.data;
  }

  async updatePublishedRanking(input: {
    userId: string;
    rankingId: string;
    ranking: RankingInput;
    expectedUpdatedAt: string;
  }): Promise<PublishedRanking> {
    const response = await fetch(`/api/v1/rankings/${input.rankingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: resolveUserId(input.userId),
        expectedUpdatedAt: input.expectedUpdatedAt,
        ranking: input.ranking,
      }),
    });
    const body = await parseJson<PublishedRanking>(response);
    if (!response.ok || !body.data) {
      throw new PublishedApiError(
        body.error?.code ?? mapStatusToErrorCode(response.status),
        body.error?.message ?? "Failed to update ranking.",
      );
    }
    return body.data;
  }

  async deletePublishedRanking(
    userId: string,
    rankingId: string,
    expectedUpdatedAt: string,
  ): Promise<void> {
    const params = new URLSearchParams({
      userId: resolveUserId(userId),
      expectedUpdatedAt,
    });
    const response = await fetch(`/api/v1/rankings/${rankingId}?${params.toString()}`, {
      method: "DELETE",
    });
    const body = (await parseJson<{ ok: boolean }>(response)) as ApiResponse<{ ok: boolean }> & {
      ok?: boolean;
    };
    const isOk = body.data?.ok ?? body.ok;
    if (!response.ok || isOk !== true) {
      throw new PublishedApiError(
        body.error?.code ?? mapStatusToErrorCode(response.status),
        body.error?.message ?? "Failed to delete ranking.",
      );
    }
  }
}
