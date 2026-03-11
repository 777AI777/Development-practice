import { NextResponse } from "next/server";
import { z } from "zod";

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
  userId: z.string().min(1),
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
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? "";
  const { id } = await params;

  if (!userId) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "userId is required." } },
      { status: 422 },
    );
  }

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
    return NextResponse.json(
      {
        error: {
          code: "SERVER",
          message: error instanceof Error ? error.message : "Failed to load ranking.",
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
    return NextResponse.json(
      {
        error: {
          code: "SERVER",
          message: error instanceof Error ? error.message : "Failed to update ranking.",
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
  const expectedUpdatedAt = url.searchParams.get("expectedUpdatedAt") ?? "";

  if (!userId || !expectedUpdatedAt) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "userId and expectedUpdatedAt are required." } },
      { status: 422 },
    );
  }

  const { id } = await params;
  try {
    await deleteRanking({ rankingId: id, userId, expectedUpdatedAt });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: error.message } },
        { status: 409 },
      );
    }
    return NextResponse.json(
      {
        error: {
          code: "SERVER",
          message: error instanceof Error ? error.message : "Failed to delete ranking.",
        },
      },
      { status: 500 },
    );
  }
}
