import { NextResponse } from "next/server";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import { listPopularTagsCached, listTags } from "@/lib/supabase-rest";
import { toTagItem } from "@/lib/tag-mappers";
import { TAG_QUERY_LIMITS } from "@/lib/constants";

export async function GET() {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }
  const { accessToken } = auth;

  try {
    const rows = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await listPopularTagsCached({
          limit: TAG_QUERY_LIMITS.POPULAR,
        })
      : await listTags(accessToken, {
          limit: TAG_QUERY_LIMITS.POPULAR,
        });

    const data = rows.map((row) => toTagItem(row, 0));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/v1/tags/popular] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/v1/tags/popular] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "タグの読み込みに失敗しました。" } },
      { status: 500 },
    );
  }
}
