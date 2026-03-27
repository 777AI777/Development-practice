import { NextResponse } from "next/server";

import {
  authErrorResponse,
  getAuthenticatedUserId,
} from "@/lib/supabase/auth-guard";
import {
  getUserTagUsage,
  listTags,
  listPopularTagsCached,
} from "@/lib/supabase-rest";
import { TAG_QUERY_LIMITS } from "@/lib/constants";
import { deduplicateByKey, rpcRowToTagItem, toTagItem } from "@/lib/tag-mappers";

export async function GET() {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }

  try {
    const [mineRows, popularRows] = await Promise.all([
      getUserTagUsage({
        userId: auth.userId,
        accessToken: auth.accessToken,
        limit: TAG_QUERY_LIMITS.MINE,
      }),
      process.env.SUPABASE_SERVICE_ROLE_KEY
        ? listPopularTagsCached({
            limit: TAG_QUERY_LIMITS.POPULAR,
          })
        : listTags(auth.accessToken, {
            limit: TAG_QUERY_LIMITS.POPULAR,
          }),
    ]);

    const data = deduplicateByKey(
      [
        ...mineRows.map(rpcRowToTagItem),
        ...popularRows.map((row) => toTagItem(row, 0)),
      ],
      (tag) => tag.id,
    );

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/v1/tags/bootstrap] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/v1/tags/bootstrap] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "タグの読み込みに失敗しました。" } },
      { status: 500 },
    );
  }
}
