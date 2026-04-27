import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit } from "@/lib/rate-limit";
import {
  requestSupabase,
  ensureResponseOk,
  mapRankingRow,
} from "@/lib/supabase-rest";
import { attachCommentsToRankings } from "@/lib/supabase-rest-comments";
import { getUserProfileWithFallback } from "@/lib/user-profile-with-fallback";
import { isValidUserProfileIdentifier } from "@/lib/user-utils";
import { decodeSearchCursor, encodeCursor } from "@/lib/search-mappers";
import { RANKING_ITEMS_PREVIEW_LIMIT } from "@/lib/constants";
import { getAuthenticatedUserId } from "@/lib/supabase/auth-guard";
import type {
  PublicRankingWithAuthor,
  PublicRankingWithAuthorAndComment,
  SupabaseRankingRow,
} from "@/lib/types";

const USER_RANKINGS_RATE_LIMIT = 30;
const DEFAULT_LIMIT = 20;

const paramsSchema = z.object({
  userId: z
    .string()
    .trim()
    .refine(
      (value) => isValidUserProfileIdentifier(value),
      "User ID must be a UUID or a display user ID.",
    ),
});

const queryParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(DEFAULT_LIMIT),
  cursor: z.string().optional(),
  type: z.enum(["posts", "rankings"]).optional().default("posts"),
});

/**
 * GET /api/v1/users/:userId/rankings
 *
 * 指定ユーザーの公開ランキング一覧を取得する（カーソルページネーション）。
 * 認証不要（公開プロフィール）。viewer認証済みの場合はブックマーク状態を付与。
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  // --- IP-based rate limit ---
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const rateLimitResult = await checkRateLimit(
    `user-rankings:${ip}`,
    USER_RANKINGS_RATE_LIMIT,
  );
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message:
            "リクエスト数が上限を超えました。しばらく待ってから再度お試しください。",
        },
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rateLimitResult.limit),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": String(rateLimitResult.reset),
        },
      },
    );
  }

  // --- URL params validation ---
  const { userId } = await params;
  const parsedParams = paramsSchema.safeParse({ userId });
  if (!parsedParams.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: parsedParams.error.issues[0]?.message ?? "Invalid user ID.",
        },
      },
      { status: 422 },
    );
  }

  // --- Query params validation ---
  const url = new URL(request.url);
  const parsedQuery = queryParamsSchema.safeParse({
    limit: url.searchParams.get("limit") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
    type: url.searchParams.get("type") ?? undefined,
  });
  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: parsedQuery.error.issues[0]?.message ?? "入力が不正です",
        },
      },
      { status: 422 },
    );
  }

  const { limit, cursor: cursorStr, type } = parsedQuery.data;
  const cursor = cursorStr ? decodeSearchCursor(cursorStr) : null;

  try {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
      return NextResponse.json(
        { error: { code: "SERVER", message: "Server configuration is missing." } },
        { status: 500 },
      );
    }

    // --- Resolve user profile ---
    const profile = await getUserProfileWithFallback(userId);
    if (!profile) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found." } },
        { status: 404 },
      );
    }

    // --- Viewer auth (optional, for bookmark state) ---
    const auth = await getAuthenticatedUserId();
    const accessToken = auth.ok ? auth.accessToken : anonKey;

    // --- Fetch rankings with cursor pagination ---
    const fetchLimit = limit + 1;

    const query = new URLSearchParams({
      select:
        "id,user_id,title,tag_id,is_public,created_at,updated_at,view_count,impression_count,bookmark_count,ranking_items(rank,item_text),tags(name)",
      user_id: `eq.${profile.id}`,
      is_public: "eq.true",
      order: "updated_at.desc,id.desc",
      limit: String(fetchLimit),
    });
    query.set("ranking_items.order", "rank.asc");
    query.set("ranking_items.limit", String(RANKING_ITEMS_PREVIEW_LIMIT));

    if (cursor) {
      query.set(
        "or",
        `(updated_at.lt.${cursor.createdAt},and(updated_at.eq.${cursor.createdAt},id.lt.${cursor.id}))`,
      );
    }

    const response = await requestSupabase(`rankings?${query.toString()}`, {
      method: "GET",
      accessToken,
    });
    await ensureResponseOk(response);
    const rows = (await response.json()) as SupabaseRankingRow[];

    const hasMore = rows.length > limit;
    const slicedRows = hasMore ? rows.slice(0, limit) : rows;

    // --- Map to PublicRankingWithAuthor ---
    const rankings: PublicRankingWithAuthor[] = slicedRows.map((row) => ({
      ...mapRankingRow(row),
      isBookmarked: false,
      author: {
        id: profile.id,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        displayUserId: profile.displayUserId,
        introduction: profile.introduction ?? null,
        links: profile.links ?? null,
      },
    }));

    // --- Attach bookmark state for authenticated viewer ---
    if (auth.ok && rankings.length > 0) {
      const bookmarkQuery = new URLSearchParams({
        select: "ranking_id",
        user_id: `eq.${auth.userId}`,
      });
      const rankingIds = rankings.map((r) => r.id);
      const inList = rankingIds
        .map((id) => `"${id.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"")}"`)
        .join(",");
      bookmarkQuery.set("ranking_id", `in.(${inList})`);

      const bookmarkResponse = await requestSupabase(
        `bookmarks?${bookmarkQuery.toString()}`,
        { method: "GET", accessToken: auth.accessToken },
      );
      await ensureResponseOk(bookmarkResponse);
      const bookmarkRows = (await bookmarkResponse.json()) as Array<{
        ranking_id: string;
      }>;
      const bookmarkedIds = new Set(bookmarkRows.map((r) => r.ranking_id));
      for (let i = 0; i < rankings.length; i++) {
        if (bookmarkedIds.has(rankings[i].id)) {
          rankings[i] = { ...rankings[i], isBookmarked: true };
        }
      }
    }

    // --- Attach comments (posts mode only) ---
    let items: PublicRankingWithAuthorAndComment[];
    if (type === "posts") {
      items = await attachCommentsToRankings(rankings, accessToken);
    } else {
      items = rankings.map((ranking) => ({ ...ranking, latestComment: null }));
    }

    // --- Build cursor ---
    // 注: createdAt フィールドに updated_at の値を格納。
    // SearchCursor型はジェネリックなソートキーとして使用しており、
    // このエンドポイントでは updated_at desc でソートしているため、
    // カーソルの createdAt にはソートキーである updated_at を入れる。
    const lastRow = slicedRows[slicedRows.length - 1];
    const nextCursor =
      hasMore && lastRow
        ? encodeCursor({ createdAt: lastRow.updated_at, id: lastRow.id })
        : null;

    return NextResponse.json({
      data: {
        items,
        nextCursor,
      },
    });
  } catch (error) {
    console.error("[GET /api/v1/users/:userId/rankings] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/v1/users/:userId/rankings] detail:", error);
    }
    return NextResponse.json(
      {
        error: {
          code: "SERVER",
          message: "ランキング一覧の取得に失敗しました。",
        },
      },
      { status: 500 },
    );
  }
}
