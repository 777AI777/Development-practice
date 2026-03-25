import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import {
  ConflictError,
  deleteRanking,
  getRankingById,
  updateRanking,
} from "@/lib/supabase-rest";
import { RANKING_ITEM_COUNT, type RankingItems } from "@/lib/types";

const rankingItemsSchema = z
  .array(
    z
      .string()
      .transform((value) => value.trim())
      .pipe(z.string().max(100, "各項目は100文字以内にしてください。")),
  )
  .length(RANKING_ITEM_COUNT)
  .refine((items) => items.some((item) => item.length > 0), {
    message: "ランキング順位は1つ以上入力してください。",
  });

const expectedUpdatedAtSchema = z
  .string()
  .datetime("expectedUpdatedAtはISO 8601形式で指定してください。");

const updateSchema = z.object({
  expectedUpdatedAt: expectedUpdatedAtSchema,
  ranking: z.object({
    title: z.string().trim().min(1, "タイトルは必須です。").max(50, "タイトルは50文字以内にしてください。"),
    tagId: z.string().uuid("タグIDはUUID形式で指定してください。"),
    items: rankingItemsSchema,
  }),
});

const deleteSchema = z.object({
  expectedUpdatedAt: expectedUpdatedAtSchema,
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
    return authErrorResponse(auth);
  }
  const { userId, accessToken } = auth;

  const { id } = await params;

  try {
    const data = await getRankingById({ userId, rankingId: id, accessToken });
    if (!data) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Ranking not found." } },
        { status: 404 },
      );
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/v1/rankings/:id] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/v1/rankings/:id] detail:", error);
    }
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
    return authErrorResponse(auth);
  }
  const { userId, accessToken } = auth;

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
      accessToken,
    });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: error.message } },
        { status: 409 },
      );
    }
    console.error("[PATCH /api/v1/rankings/:id] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[PATCH /api/v1/rankings/:id] detail:", error);
    }
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
    return authErrorResponse(auth);
  }
  const { userId, accessToken } = auth;

  const url = new URL(request.url);
  const parsed = deleteSchema.safeParse({
    expectedUpdatedAt: url.searchParams.get("expectedUpdatedAt") ?? "",
  });

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
    await deleteRanking({ rankingId: id, userId, expectedUpdatedAt: parsed.data.expectedUpdatedAt, accessToken });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: error.message } },
        { status: 409 },
      );
    }
    console.error("[DELETE /api/v1/rankings/:id] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[DELETE /api/v1/rankings/:id] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "ランキングの削除に失敗しました。" } },
      { status: 500 },
    );
  }
}
