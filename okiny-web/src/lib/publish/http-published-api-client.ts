import type { AppErrorCode, PublishedRanking, RankingInput } from "@/lib/types";

interface RankingCreateResponse {
  data?: PublishedRanking;
  error?: {
    code?: AppErrorCode;
    message?: string;
  };
}

export class PublishedApiError extends Error {
  code: AppErrorCode;

  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.name = "PublishedApiError";
    this.code = code;
  }
}

export interface PublishedApiClient {
  createPublishedRanking(input: {
    userId: string;
    ranking: RankingInput;
  }): Promise<PublishedRanking>;
}

export class HttpPublishedApiClient implements PublishedApiClient {
  async createPublishedRanking(input: {
    userId: string;
    ranking: RankingInput;
  }): Promise<PublishedRanking> {
    let response: Response;

    try {
      response = await fetch("/api/v1/rankings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    } catch {
      throw new PublishedApiError(
        "NETWORK",
        "通信エラーが発生しました。時間をおいて再試行してください。",
      );
    }

    const body = (await response.json()) as RankingCreateResponse;
    if (!response.ok || !body.data) {
      const code = body.error?.code ?? "SERVER";
      const message = body.error?.message ?? "保存に失敗しました。";
      throw new PublishedApiError(code, message);
    }

    return body.data;
  }

  async listPublishedRankings(userId: string): Promise<PublishedRanking[]> {
    let response: Response;

    try {
      response = await fetch(`/api/v1/rankings?userId=${encodeURIComponent(userId)}`);
    } catch {
      throw new PublishedApiError(
        "NETWORK",
        "通信エラーが発生しました。時間をおいて再試行してください。",
      );
    }

    const body = (await response.json()) as {
      data?: PublishedRanking[];
      error?: { code?: AppErrorCode; message?: string };
    };
    if (!response.ok || !body.data) {
      const code = body.error?.code ?? "SERVER";
      const message = body.error?.message ?? "一覧取得に失敗しました。";
      throw new PublishedApiError(code, message);
    }

    return body.data;
  }
}
