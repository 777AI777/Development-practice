import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import { searchRankings } from "@/lib/supabase-rest";
import { decodeSearchCursor } from "@/lib/search-mappers";
import {
  SEARCH_LIMIT,
  SEARCH_QUERY_MIN_LENGTH,
  SEARCH_QUERY_MAX_LENGTH,
} from "@/lib/constants";

const searchParamsSchema = z.object({
  q: z
    .string()
    .min(SEARCH_QUERY_MIN_LENGTH, "検索クエリを入力してください")
    .max(SEARCH_QUERY_MAX_LENGTH, `検索クエリは${SEARCH_QUERY_MAX_LENGTH}文字以内です`),
  limit: z.coerce.number().int().min(1).max(50).optional().default(SEARCH_LIMIT),
  cursor: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) return authErrorResponse(auth);

  const url = new URL(request.url);
  const rawQ = url.searchParams.get("q")?.replace(/[\s\u3000]+/g, " ").trim() ?? "";
  const parsed = searchParamsSchema.safeParse({
    q: rawQ,
    limit: url.searchParams.get("limit") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "入力が不正です" } },
      { status: 422 },
    );
  }

  const { q, limit, cursor: cursorStr } = parsed.data;
  const cursor = cursorStr ? decodeSearchCursor(cursorStr) ?? null : null;

  try {
    const result = await searchRankings({
      query: q,
      viewerUserId: auth.userId,
      accessToken: auth.accessToken,
      limit,
      cursor,
    });

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER", message: "検索に失敗しました" } },
      { status: 500 },
    );
  }
}
