import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import {
  getTagByName,
  createTag,
  appendTagReading,
} from "@/lib/supabase-rest";
import { tagNameSchema, containsBannedWord } from "@/lib/tag-validation";
import { getReadings } from "@/lib/yahoo-furigana";
import { toTagItem } from "@/lib/tag-mappers";

const createTagBodySchema = z.object({
  name: tagNameSchema,
});

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

  const parsed = createTagBodySchema.safeParse(payload);
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

  const normalizedName = parsed.data.name;

  if (containsBannedWord(normalizedName)) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "使用できない単語が含まれています。" } },
      { status: 400 },
    );
  }

  try {
    const existing = await getTagByName(normalizedName, accessToken);

    if (existing) {
      const newReadings = await getReadings(normalizedName);
      const hasNewReadings = newReadings.some(
        (r) => !existing.readings.includes(r),
      );
      if (hasNewReadings) {
        await appendTagReading(
          existing.id,
          newReadings,
          existing.readings,
          accessToken,
        );
        const refreshed = await getTagByName(normalizedName, accessToken);
        if (refreshed) {
          return NextResponse.json(
            { data: toTagItem(refreshed) },
            { status: 200 },
          );
        }
      }
      return NextResponse.json(
        { data: toTagItem(existing) },
        { status: 200 },
      );
    }

    const readings = await getReadings(normalizedName);

    try {
      const created = await createTag(
        { name: normalizedName, readings },
        accessToken,
      );
      return NextResponse.json(
        { data: toTagItem(created) },
        { status: 201 },
      );
    } catch {
      // UNIQUE constraint violation — tag was created by another request
      const retried = await getTagByName(normalizedName, accessToken);
      if (retried) {
        return NextResponse.json(
          { data: toTagItem(retried) },
          { status: 200 },
        );
      }
      throw new Error("Tag creation failed unexpectedly");
    }
  } catch (error) {
    console.error("[POST /api/v1/tags] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[POST /api/v1/tags] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "タグの作成に失敗しました。" } },
      { status: 500 },
    );
  }
}
