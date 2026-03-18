import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import { searchTagsUnified } from "@/lib/supabase-rest";
import { toTagItem } from "@/lib/tag-mappers";
import { TAG_QUERY_LIMITS } from "@/lib/constants";
import { normalizeTagName } from "@/lib/tag-utils";
import { hiraganaToKatakana } from "@/lib/yahoo-furigana";

const searchQuerySchema = z.string().min(1).max(20);

export async function GET(request: Request) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }
  const { accessToken } = auth;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  const parsed = searchQuerySchema.safeParse(q);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: q === ""
            ? "検索クエリを指定してください。"
            : "検索クエリは20文字以内です。",
        },
      },
      { status: 422 },
    );
  }

  try {
    const normalizedQ = normalizeTagName(q);
    const katakanaQ = hiraganaToKatakana(normalizedQ);

    const rows = await searchTagsUnified({
      query: normalizedQ,
      katakanaQuery: katakanaQ,
      limit: TAG_QUERY_LIMITS.SEARCH,
      accessToken,
    });

    const data = rows.map((row) => toTagItem(row, 0));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/v1/tags/search] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/v1/tags/search] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "タグの検索に失敗しました。" } },
      { status: 500 },
    );
  }
}
