import type { AppErrorCode, PublicRankingWithAuthor, PublishedRanking, RankingInput, SearchPage, TagItem, UserSearchResult } from "@/lib/types";

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
  listPublicRankingsByTag(tagId: string): Promise<PublicRankingWithAuthor[]>;
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
  createTag(name: string): Promise<TagItem>;
  bookmarkRanking(rankingId: string): Promise<void>;
  unbookmarkRanking(rankingId: string): Promise<void>;
  recordView(rankingId: string): Promise<void>;
  recordImpressions(rankingIds: string[]): Promise<void>;
  searchRankings(query: string, cursor?: string | null): Promise<SearchPage<PublicRankingWithAuthor>>;
  searchUsers(query: string, cursor?: string | null): Promise<SearchPage<UserSearchResult>>;
  followUser(userId: string): Promise<void>;
  unfollowUser(userId: string): Promise<void>;
  listFollowingRankings(): Promise<PublicRankingWithAuthor[]>;
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

  async listPublicRankingsByTag(tagId: string): Promise<PublicRankingWithAuthor[]> {
    const params = new URLSearchParams({
      tagId,
      scope: "public",
    });
    const url = `/api/v1/rankings?${params.toString()}`;
    const response = await fetch(url, {
      cache: "no-store",
    });
    const body = await parseJson<PublicRankingWithAuthor[]>(response);
    if (!response.ok || !body.data) {
      throw new PublishedApiError(
        body.error?.code ?? mapStatusToErrorCode(response.status),
        body.error?.message ?? "公開ランキングの取得に失敗しました。",
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
        body.error?.message ?? "ランキングの作成に失敗しました。",
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
        body.error?.message ?? "ランキングの更新に失敗しました。",
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
      body.error?.message ?? "ランキングの削除に失敗しました。",
    );
  }

  async createTag(name: string): Promise<TagItem> {
    const response = await fetch("/api/v1/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = await parseJson<TagItem>(response);
    if (!response.ok || !body.data) {
      throw new PublishedApiError(
        body.error?.code ?? mapStatusToErrorCode(response.status),
        body.error?.message ?? "タグの作成に失敗しました。",
      );
    }
    return body.data;
  }

  async bookmarkRanking(rankingId: string): Promise<void> {
    const response = await fetch(`/api/v1/bookmarks/${rankingId}`, {
      method: "POST",
    });
    if (response.status === 204) {
      return;
    }
    const body = await parseJson<unknown>(response);
    throw new PublishedApiError(
      body.error?.code ?? mapStatusToErrorCode(response.status),
      body.error?.message ?? "ブックマークの追加に失敗しました。",
    );
  }

  async unbookmarkRanking(rankingId: string): Promise<void> {
    const response = await fetch(`/api/v1/bookmarks/${rankingId}`, {
      method: "DELETE",
    });
    if (response.status === 204) {
      return;
    }
    const body = await parseJson<unknown>(response);
    throw new PublishedApiError(
      body.error?.code ?? mapStatusToErrorCode(response.status),
      body.error?.message ?? "ブックマークの削除に失敗しました。",
    );
  }

  async recordView(rankingId: string): Promise<void> {
    const response = await fetch(`/api/v1/rankings/${rankingId}/views`, {
      method: "POST",
    });
    // 閲覧記録は失敗してもユーザー体験に影響しないため、エラーを握りつぶす
    if (response.status === 204 || response.ok) {
      return;
    }
    // サイレントに失敗（ログはサーバー側で出力済み）
  }

  async recordImpressions(rankingIds: string[]): Promise<void> {
    if (rankingIds.length === 0) return;
    await fetch("/api/v1/rankings/impressions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rankingIds }),
    });
    // インプレッション記録は失敗してもユーザー体験に影響しないため、エラーを握りつぶす
  }

  async searchRankings(
    query: string,
    cursor?: string | null,
  ): Promise<SearchPage<PublicRankingWithAuthor>> {
    const params = new URLSearchParams({ q: query });
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/v1/search/rankings?${params}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new PublishedApiError(
        mapStatusToErrorCode(res.status),
        body?.error?.message ?? "検索に失敗しました",
      );
    }
    const json = await res.json();
    return json.data;
  }

  async searchUsers(
    query: string,
    cursor?: string | null,
  ): Promise<SearchPage<UserSearchResult>> {
    const params = new URLSearchParams({ q: query });
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/v1/search/users?${params}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new PublishedApiError(
        mapStatusToErrorCode(res.status),
        body?.error?.message ?? "検索に失敗しました",
      );
    }
    const json = await res.json();
    return json.data;
  }

  async followUser(userId: string): Promise<void> {
    const response = await fetch(`/api/v1/users/${userId}/follow`, {
      method: "POST",
    });
    if (response.status === 204) {
      return;
    }
    const body = await parseJson<unknown>(response);
    throw new PublishedApiError(
      body.error?.code ?? mapStatusToErrorCode(response.status),
      body.error?.message ?? "フォローに失敗しました。",
    );
  }

  async unfollowUser(userId: string): Promise<void> {
    const response = await fetch(`/api/v1/users/${userId}/follow`, {
      method: "DELETE",
    });
    if (response.status === 204) {
      return;
    }
    const body = await parseJson<unknown>(response);
    throw new PublishedApiError(
      body.error?.code ?? mapStatusToErrorCode(response.status),
      body.error?.message ?? "フォロー解除に失敗しました。",
    );
  }

  async listFollowingRankings(): Promise<PublicRankingWithAuthor[]> {
    const response = await fetch("/api/v1/rankings/following", {
      cache: "no-store",
    });
    const body = await parseJson<PublicRankingWithAuthor[]>(response);
    if (!response.ok || !body.data) {
      throw new PublishedApiError(
        body.error?.code ?? mapStatusToErrorCode(response.status),
        body.error?.message ?? "フォロー中ランキングの取得に失敗しました。",
      );
    }
    return body.data;
  }
}
