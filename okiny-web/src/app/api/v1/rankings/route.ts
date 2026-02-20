import { getPublishedRepository } from "@/lib/published/memory-published-repository";
import { RANKING_ITEM_COUNT, type RankingItems } from "@/lib/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const createPublishedRankingSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  ranking: z.object({
    title: z.string().trim().min(1, "タイトルは必須です。"),
    tagId: z.string().trim().min(1, "タグは必須です。"),
    items: z
      .array(z.string().trim().min(1, "各順位の項目は必須です。"))
      .length(RANKING_ITEM_COUNT),
  }),
});

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("userId") ?? "";
  if (!userId) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "userId is required" } },
      { status: 422 },
    );
  }

  const repository = getPublishedRepository();
  const data = await repository.listByUser(userId);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "Invalid JSON payload." } },
      { status: 422 },
    );
  }

  const parsed = createPublishedRankingSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: parsed.error.issues[0]?.message ?? "入力内容を確認してください。",
        },
      },
      { status: 422 },
    );
  }

  try {
    const repository = getPublishedRepository();
    const rankingItems = [
      parsed.data.ranking.items[0],
      parsed.data.ranking.items[1],
      parsed.data.ranking.items[2],
      parsed.data.ranking.items[3],
      parsed.data.ranking.items[4],
    ] as RankingItems;

    const data = await repository.create({
      userId: parsed.data.userId,
      ranking: {
        title: parsed.data.ranking.title,
        tagId: parsed.data.ranking.tagId,
        items: rankingItems,
      },
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER", message: "サーバーで問題が発生しました。" } },
      { status: 500 },
    );
  }
}
