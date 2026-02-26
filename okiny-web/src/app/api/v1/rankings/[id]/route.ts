import { z } from "zod";
import { NextResponse } from "next/server";

import {
  deleteRanking,
  getRankingById,
  updateRanking,
} from "@/lib/supabase-rest";
import { RANKING_ITEM_COUNT, type RankingItems } from "@/lib/types";

const updateSchema = z.object({
  userId: z.string().min(1),
  ranking: z.object({
    title: z.string().trim().min(1, "タイトルは必須です。"),
    tagId: z.string().trim().min(1, "タグは必須です。"),
    items: z
      .array(z.string().trim().min(1, "ランキング項目はすべて必須です。"))
      .length(RANKING_ITEM_COUNT),
  }),
});

function toRankingItems(items: string[]): RankingItems {
  return [items[0] ?? "", items[1] ?? "", items[2] ?? "", items[3] ?? "", items[4] ?? ""];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? "";
  const { id } = await params;

  if (!userId) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "userId クエリパラメータは必須です。" } },
      { status: 422 },
    );
  }

  try {
    const data = await getRankingById({ userId, rankingId: id });
    if (!data) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "ランキングが見つかりません。" } },
        { status: 404 },
      );
    }
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "SERVER",
          message: error instanceof Error ? error.message : "ランキングの読み込みに失敗しました。",
        },
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "Invalid JSON payload." } },
      { status: 422 },
    );
  }

  const parsed = updateSchema.safeParse(payload);
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

  const { id } = await params;

  try {
    const data = await updateRanking({
      rankingId: id,
      userId: parsed.data.userId,
      title: parsed.data.ranking.title,
      tagId: parsed.data.ranking.tagId,
      items: toRankingItems(parsed.data.ranking.items),
    });
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "SERVER",
          message: error instanceof Error ? error.message : "ランキングの更新に失敗しました。",
        },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? "";

  if (!userId) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "userId クエリパラメータは必須です。" } },
      { status: 422 },
    );
  }

  const { id } = await params;
  try {
    await deleteRanking({ rankingId: id, userId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "SERVER",
          message: error instanceof Error ? error.message : "ランキングの削除に失敗しました。",
        },
      },
      { status: 500 },
    );
  }
}

