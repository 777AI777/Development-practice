import { NextResponse } from "next/server";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import { getUserTagUsage } from "@/lib/supabase-rest";
import { rpcRowToTagItem } from "@/lib/tag-mappers";
import { TAG_QUERY_LIMITS } from "@/lib/constants";

export async function GET() {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }
  const { userId, accessToken } = auth;

  try {
    const rows = await getUserTagUsage({
      userId,
      accessToken,
      limit: TAG_QUERY_LIMITS.MINE,
    });

    const data = rows.map(rpcRowToTagItem);

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/v1/tags/mine] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/v1/tags/mine] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "タグの読み込みに失敗しました。" } },
      { status: 500 },
    );
  }
}
