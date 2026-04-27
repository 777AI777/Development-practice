import { NextResponse } from "next/server";
import { z } from "zod";

import {
  authErrorResponse,
  getAuthenticatedUserId,
} from "@/lib/supabase/auth-guard";
import {
  attachCommentsToRankings,
  createRanking,
  createRankingComment,
  listPublicRankingsByTagWithAuthors,
  listRankingsByUser,
} from "@/lib/supabase-rest";
import { RANKING_ITEM_COUNT, type RankingItems } from "@/lib/types";
import { COMMENT_MAX_LENGTH } from "@/lib/constants";
import { BORDER_COLORS } from "@/components/shared/theme-colors";
import { MARKER_ICONS } from "@/components/shared/marker-icons";

const validBorderColors = BORDER_COLORS.map((c) => c.value) as [string, ...string[]];
const validMarkerIcons = MARKER_ICONS.map((i) => i.name) as [string, ...string[]];

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
    borderColor: z.enum(validBorderColors).default("#FFE5E5"),
    markerIcon: z.enum(validMarkerIcons).default("Heart"),
  }),
  comment: z.string().max(COMMENT_MAX_LENGTH, `コメントは${COMMENT_MAX_LENGTH}文字以内にしてください。`).optional(),
});

function toRankingItems(items: string[]): RankingItems {
  return [items[0] ?? "", items[1] ?? "", items[2] ?? ""];
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

      const rankings = await listPublicRankingsByTagWithAuthors({
        tagId,
        viewerUserId: userId,
        accessToken,
      });
      const data = await attachCommentsToRankings(rankings, accessToken);

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
      borderColor: parsed.data.ranking.borderColor,
      markerIcon: parsed.data.ranking.markerIcon,
      accessToken,
    });

    const warnings: string[] = [];
    if (parsed.data.comment?.trim()) {
      try {
        await createRankingComment({
          rankingId: created.id,
          userId,
          comment: parsed.data.comment.trim(),
          accessToken,
        });
      } catch (commentError) {
        console.error("[POST /api/v1/rankings] comment creation failed (non-blocking)");
        if (process.env.NODE_ENV !== "production") {
          console.error("[POST /api/v1/rankings] comment detail:", commentError);
        }
        warnings.push("コメントの保存に失敗しました。");
      }
    }

    return NextResponse.json({ data: created, ...(warnings.length > 0 && { warnings }) }, { status: 201 });
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
