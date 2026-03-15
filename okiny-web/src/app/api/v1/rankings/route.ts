import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUserId } from "@/lib/supabase/auth-guard";
import { createRanking, listRankingsByUser } from "@/lib/supabase-rest";
import { RANKING_ITEM_COUNT, type RankingItems } from "@/lib/types";

const rankingItemsSchema = z
  .array(z.string().transform((value) => value.trim()))
  .length(RANKING_ITEM_COUNT)
  .refine((items) => items.some((item) => item.length > 0), {
    message: "ランキング順位は1つ以上入力してください。",
  });

const createSchema = z.object({
  ranking: z.object({
    title: z.string().trim().min(1, "タイトルは必須です。"),
    tagId: z.string().trim().min(1, "タグは必須です。"),
    items: rankingItemsSchema,
  }),
});

function toRankingItems(items: string[]): RankingItems {
  return [items[0] ?? "", items[1] ?? "", items[2] ?? "", items[3] ?? "", items[4] ?? ""];
}

export async function GET(request: Request) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    const status = auth.reason === "unauthorized" ? 401 : 503;
    const code = auth.reason === "unauthorized" ? "UNAUTHORIZED" : "SERVER";
    const message = auth.reason === "unauthorized" ? "認証が必要です。" : "認証サービスに接続できません。";
    return NextResponse.json({ error: { code, message } }, { status });
  }
  const userId = auth.userId;

  const url = new URL(request.url);
  const tagId = url.searchParams.get("tagId") ?? undefined;

  try {
    const data = await listRankingsByUser({ userId, tagId });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/v1/rankings]", error);
    return NextResponse.json(
      { error: { code: "SERVER", message: "ランキングの読み込みに失敗しました。" } },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    const status = auth.reason === "unauthorized" ? 401 : 503;
    const code = auth.reason === "unauthorized" ? "UNAUTHORIZED" : "SERVER";
    const message = auth.reason === "unauthorized" ? "認証が必要です。" : "認証サービスに接続できません。";
    return NextResponse.json({ error: { code, message } }, { status });
  }
  const userId = auth.userId;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "Invalid JSON payload." } },
      { status: 422 },
    );
  }

  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: parsed.error.issues[0]?.message ?? "Invalid input.",
        },
      },
      { status: 422 },
    );
  }

  try {
    const created = await createRanking({
      userId,
      title: parsed.data.ranking.title,
      tagId: parsed.data.ranking.tagId,
      items: toRankingItems(parsed.data.ranking.items),
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/v1/rankings]", error);
    return NextResponse.json(
      { error: { code: "SERVER", message: "ランキングの作成に失敗しました。" } },
      { status: 500 },
    );
  }
}
