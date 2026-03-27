import { NextResponse } from "next/server";
import { z } from "zod";

import {
  authErrorResponse,
  getAuthenticatedUserId,
} from "@/lib/supabase/auth-guard";
import {
  createRanking,
  listPublicRankingsByTagWithAuthors,
  listRankingsByUser,
} from "@/lib/supabase-rest";
import { RANKING_ITEM_COUNT, type RankingItems } from "@/lib/types";

const rankingItemsSchema = z
  .array(
    z
      .string()
      .transform((value) => value.trim())
      .pipe(z.string().max(100, "Each item must be 100 characters or fewer.")),
  )
  .length(RANKING_ITEM_COUNT)
  .refine((items) => items.some((item) => item.length > 0), {
    message: "Enter at least one ranking item.",
  });

const createSchema = z.object({
  ranking: z.object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required.")
      .max(50, "Title must be 50 characters or fewer."),
    tagId: z.string().uuid("tagId must be a valid UUID."),
    items: rankingItemsSchema,
    isPublic: z.boolean().default(true),
  }),
});

function toRankingItems(items: string[]): RankingItems {
  return [items[0] ?? "", items[1] ?? "", items[2] ?? "", items[3] ?? "", items[4] ?? ""];
}

export async function GET(request: Request) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }
  const { userId, accessToken } = auth;

  const url = new URL(request.url);
  const rawTagId = url.searchParams.get("tagId");
  if (rawTagId !== null && !z.string().uuid().safeParse(rawTagId).success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "tagId must be a valid UUID." } },
      { status: 422 },
    );
  }

  const tagId = rawTagId ?? undefined;
  const scope = url.searchParams.get("scope");

  if (scope === "public") {
    if (!tagId) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "tagId is required when scope=public." } },
        { status: 422 },
      );
    }

    try {
      if (process.env.NODE_ENV !== "production") {
        console.info(
          `[GET /api/v1/rankings?scope=public] viewerUserId=${userId}, tagId=${tagId}`,
        );
      }

      const data = await listPublicRankingsByTagWithAuthors({
        tagId,
        viewerUserId: userId,
        accessToken,
      });

      if (
        process.env.NODE_ENV !== "production" &&
        data.some((ranking) => ranking.userId === userId)
      ) {
        console.warn(
          "[GET /api/v1/rankings?scope=public] self-exclusion failed: own rankings found in results",
        );
      }

      return NextResponse.json({ data });
    } catch (error) {
      console.error("[GET /api/v1/rankings?scope=public] failed");
      if (process.env.NODE_ENV !== "production") {
        console.error("[GET /api/v1/rankings?scope=public] detail:", error);
      }
      return NextResponse.json(
        { error: { code: "SERVER", message: "Failed to load public rankings." } },
        { status: 500 },
      );
    }
  }

  try {
    const data = await listRankingsByUser({ userId, tagId, accessToken });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/v1/rankings] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/v1/rankings] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "Failed to load rankings." } },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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
      isPublic: parsed.data.ranking.isPublic,
      accessToken,
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/v1/rankings] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[POST /api/v1/rankings] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "Failed to create ranking." } },
      { status: 500 },
    );
  }
}
