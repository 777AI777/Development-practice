import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import {
  listTags,
  countTagUsageByUser,
  searchTagsByReading,
  searchTagsByName,
  getTagByName,
  createTag,
  appendTagReading,
} from "@/lib/supabase-rest";
import { tagNameSchema, containsBannedWord } from "@/lib/tag-validation";
import { getReadings, hiraganaToKatakana } from "@/lib/yahoo-furigana";
import type { SupabaseTagRow, TagItem } from "@/lib/types";

function toTagItem(row: SupabaseTagRow, myUsageCount = 0): TagItem {
  return {
    id: row.id,
    name: row.name,
    readings: row.readings,
    usageCount: row.usage_count,
    myUsageCount,
    createdAt: row.created_at,
  };
}

function deduplicateByKey<T>(items: readonly T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

function sortTags(tags: readonly SupabaseTagRow[], usageMap: ReadonlyMap<string, number>): SupabaseTagRow[] {
  return [...tags].sort((a, b) => {
    const aMyUsage = usageMap.get(a.id) ?? 0;
    const bMyUsage = usageMap.get(b.id) ?? 0;
    if (aMyUsage !== bMyUsage) return bMyUsage - aMyUsage;
    if (a.usage_count !== b.usage_count) return b.usage_count - a.usage_count;
    return a.created_at.localeCompare(b.created_at);
  });
}

const createTagBodySchema = z.object({
  name: tagNameSchema,
});

export async function GET(request: Request) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }
  const { userId, accessToken } = auth;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  if (q.length > 20) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "検索クエリは20文字以内です" } },
      { status: 422 },
    );
  }

  try {
    const usageMap = await countTagUsageByUser({ userId, accessToken });

    let tags: SupabaseTagRow[];
    if (q === "") {
      tags = await listTags(accessToken);
    } else {
      const katakanaQuery = hiraganaToKatakana(q);
      const [byReading, byName] = await Promise.all([
        searchTagsByReading(katakanaQuery, accessToken),
        searchTagsByName(q, accessToken),
      ]);
      tags = deduplicateByKey([...byReading, ...byName], (t) => t.id);
    }

    const sorted = sortTags(tags, usageMap);
    const data = sorted.map((tag) => toTagItem(tag, usageMap.get(tag.id) ?? 0));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/v1/tags] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/v1/tags] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "タグの読み込みに失敗しました。" } },
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
