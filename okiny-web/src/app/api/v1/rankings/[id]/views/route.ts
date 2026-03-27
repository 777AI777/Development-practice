import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUserId } from "@/lib/supabase/auth-guard";
import { incrementViewCount } from "@/lib/supabase-rest";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const paramsSchema = z.object({
  id: z.string().regex(UUID_PATTERN, "ランキングIDはUUID形式で指定してください。"),
});

/** サーバーメモリ上の閲覧キャッシュ（24時間TTL） */
const VIEW_CACHE = new Map<string, number>();
const VIEW_TTL_MS = 24 * 60 * 60 * 1000;

function cleanExpiredEntries() {
  const now = Date.now();
  for (const [key, timestamp] of VIEW_CACHE) {
    if (now - timestamp > VIEW_TTL_MS) {
      VIEW_CACHE.delete(key);
    }
  }
}

// 5分ごとに期限切れエントリを掃除
let lastCleanup = Date.now();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const parsedParams = paramsSchema.safeParse({ id });
  if (!parsedParams.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: parsedParams.error.issues[0]?.message ?? "Invalid ranking ID.",
        },
      },
      { status: 422 },
    );
  }

  const auth = await getAuthenticatedUserId();
  const accessToken = auth.ok ? auth.accessToken : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  // 閲覧者の識別子を生成
  let viewerKey: string;
  if (auth.ok) {
    viewerKey = `user:${auth.userId}`;
  } else {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
    viewerKey = `ip:${ip}`;
  }

  const cacheKey = `${id}:${viewerKey}`;
  const now = Date.now();

  // 期限切れエントリの掃除（5分間隔）
  if (now - lastCleanup > 5 * 60 * 1000) {
    cleanExpiredEntries();
    lastCleanup = now;
  }

  // 24時間以内に同じ閲覧者がカウント済みならスキップ
  const lastViewed = VIEW_CACHE.get(cacheKey);
  if (lastViewed && now - lastViewed < VIEW_TTL_MS) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    await incrementViewCount({ rankingId: id, accessToken });
    VIEW_CACHE.set(cacheKey, now);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[POST /api/v1/rankings/:id/views] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[POST /api/v1/rankings/:id/views] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "閲覧の記録に失敗しました。" } },
      { status: 500 },
    );
  }
}
