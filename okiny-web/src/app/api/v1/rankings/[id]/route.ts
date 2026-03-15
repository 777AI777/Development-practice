import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUserId } from "@/lib/supabase/auth-guard";
import {
  ConflictError,
  deleteRanking,
  getRankingById,
  updateRanking,
} from "@/lib/supabase-rest";
import { RANKING_ITEM_COUNT, type RankingItems } from "@/lib/types";

const rankingItemsSchema = z
  .array(z.string().transform((value) => value.trim()))
  .length(RANKING_ITEM_COUNT)
  .refine((items) => items.some((item) => item.length > 0), {
    message: "At least one item is required.",
  });

const updateSchema = z.object({
  expectedUpdatedAt: z.string().min(1),
  ranking: z.object({
    title: z.string().trim().min(1, "Title is required."),
    tagId: z.string().trim().min(1, "Tag is required."),
    items: rankingItemsSchema,
  }),
});

function toRankingItems(items: string[]): RankingItems {
  return [items[0] ?? "", items[1] ?? "", items[2] ?? "", items[3] ?? "", items[4] ?? ""];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    const status = auth.reason === "unauthorized" ? 401 : 503;
    const code = auth.reason === "unauthorized" ? "UNAUTHORIZED" : "SERVER";
    const message = auth.reason === "unauthorized" ? "認証が必要です。" : "認証サービスに接続できません。";
    return NextResponse.json({ error: { code, message } }, { status });
  }
  const userId = auth.userId;

  const { id } = await params;

  try {
    const data = await getRankingById({ userId, rankingId: id });
    if (!data) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Ranking not found." } },
        { status: 404 },
      );
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/v1/rankings/:id]", error);
    return NextResponse.json(
      { error: { code: "SERVER", message: "ランキングの読み込みに失敗しました。" } },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
      userId,
      title: parsed.data.ranking.title,
      tagId: parsed.data.ranking.tagId,
      items: toRankingItems(parsed.data.ranking.items),
      expectedUpdatedAt: parsed.data.expectedUpdatedAt,
    });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: error.message } },
        { status: 409 },
      );
    }
    console.error("[PATCH /api/v1/rankings/:id]", error);
    return NextResponse.json(
      { error: { code: "SERVER", message: "ランキングの更新に失敗しました。" } },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    const status = auth.reason === "unauthorized" ? 401 : 503;
    const code = auth.reason === "unauthorized" ? "UNAUTHORIZED" : "SERVER";
    const message = auth.reason === "unauthorized" ? "認証が必要です。" : "認証サービスに接続できません。";
    return NextResponse.json({ error: { code, message } }, { status });
  }
  const userId = auth.userId;

  const url = new URL(request.url);
  const expectedUpdatedAt = url.searchParams.get("expectedUpdatedAt") ?? "";

  if (!expectedUpdatedAt) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "expectedUpdatedAt is required." } },
      { status: 422 },
    );
  }

  const { id } = await params;
  try {
    await deleteRanking({ rankingId: id, userId, expectedUpdatedAt });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: error.message } },
        { status: 409 },
      );
    }
    console.error("[DELETE /api/v1/rankings/:id]", error);
    return NextResponse.json(
      { error: { code: "SERVER", message: "ランキングの削除に失敗しました。" } },
      { status: 500 },
    );
  }
}
