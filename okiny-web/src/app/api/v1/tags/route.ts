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

/**
 * タグ作成後に非同期でembeddingを生成・保存する（fire-and-forget）。
 * GEMINI_API_KEY が未設定の場合はサイレントにスキップ。
 */
async function generateAndSaveTagEmbedding(
  tagId: string,
  tagName: string,
): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;

  try {
    const embeddingRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          model: "models/gemini-embedding-001",
          content: { parts: [{ text: tagName }] },
          outputDimensionality: 768,
        }),
      },
    );

    if (!embeddingRes.ok) {
      if (process.env.NODE_ENV !== "production") {
        const detail = await embeddingRes.text();
        console.error(`[generateAndSaveTagEmbedding] Gemini API error (${embeddingRes.status}):`, detail);
      }
      return;
    }

    const data = (await embeddingRes.json()) as {
      embedding: { values: number[] };
    };
    const embedding = data.embedding.values;

    // Supabase REST で tags テーブルを更新（service_role key 使用）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) return;

    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/tags?id=eq.${tagId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ embedding }),
      },
    );

    if (!updateRes.ok && process.env.NODE_ENV !== "production") {
      const detail = await updateRes.text();
      console.error(`[generateAndSaveTagEmbedding] Supabase update error (${updateRes.status}):`, detail);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[generateAndSaveTagEmbedding] unexpected error:", err);
    }
  }
}

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
      // 新規作成成功後、非同期でembeddingを生成・保存（レスポンスをブロックしない）
      generateAndSaveTagEmbedding(created.id, created.name).catch((err) => {
        console.warn("[POST /api/v1/tags] embedding generation failed:", err);
      });
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
