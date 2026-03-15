import type { AppErrorCode, PublishedRanking, RankingInput } from "@/lib/types";

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

async function parseJson<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {};
  }
}

export interface PublishedApiClient {
  listPublishedRankings(tagId?: string): Promise<PublishedRanking[]>;
  getPublishedRanking(rankingId: string): Promise<PublishedRanking>;
  createPublishedRanking(input: {
    ranking: RankingInput;
  }): Promise<PublishedRanking>;
  updatePublishedRanking(input: {
    rankingId: string;
    ranking: RankingInput;
    expectedUpdatedAt: string;
  }): Promise<PublishedRanking>;
  deletePublishedRanking(rankingId: string, expectedUpdatedAt: string): Promise<void>;
}

export class HttpPublishedApiClient implements PublishedApiClient {
  async listPublishedRankings(tagId?: string): Promise<PublishedRanking[]> {
    const params = new URLSearchParams();
    if (tagId) {
      params.set("tagId", tagId);
    }
    const qs = params.toString();
    const url = qs ? `/api/v1/rankings?${qs}` : "/api/v1/rankings";
    const response = await fetch(url, {
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

  async getPublishedRanking(rankingId: string): Promise<PublishedRanking> {
    const response = await fetch(`/api/v1/rankings/${rankingId}`, {
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
    rankingId: string;
    ranking: RankingInput;
    expectedUpdatedAt: string;
  }): Promise<PublishedRanking> {
    const response = await fetch(`/api/v1/rankings/${input.rankingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
    rankingId: string,
    expectedUpdatedAt: string,
  ): Promise<void> {
    const params = new URLSearchParams({ expectedUpdatedAt });
    const response = await fetch(`/api/v1/rankings/${rankingId}?${params.toString()}`, {
      method: "DELETE",
    });
    if (response.status === 204) {
      return;
    }
    const body = await parseJson<unknown>(response);
    throw new PublishedApiError(
      body.error?.code ?? mapStatusToErrorCode(response.status),
      body.error?.message ?? "Failed to delete ranking.",
    );
  }
}
