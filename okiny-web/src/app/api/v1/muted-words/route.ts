import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  getAuthenticatedUserId,
  authErrorResponse,
} from "@/lib/supabase/auth-guard";
import {
  listMutedWords,
  addMutedWord,
} from "@/lib/supabase-rest-muted-words";

const addMutedWordSchema = z.object({
  word: z
    .string()
    .trim()
    .min(1, "ミュートワードを入力してください。")
    .max(50, "ミュートワードは50文字以内で入力してください。"),
});

/**
 * GET /api/v1/muted-words
 *
 * ミュートワード一覧を取得する（認証必須）。
 */
export async function GET() {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }

  try {
    const words = await listMutedWords({
      userId: auth.userId,
      accessToken: auth.accessToken,
    });
    return NextResponse.json({ data: words });
  } catch (error) {
    console.error("[GET /api/v1/muted-words] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/v1/muted-words] detail:", error);
    }
    return NextResponse.json(
      {
        error: {
          code: "SERVER",
          message: "ミュートワードの取得に失敗しました。",
        },
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/muted-words
 *
 * ミュートワードを追加する（認証必須・冪等）。
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: "リクエストボディが不正です。",
        },
      },
      { status: 422 },
    );
  }

  const parsed = addMutedWordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: parsed.error.issues[0]?.message ?? "入力が不正です。",
        },
      },
      { status: 422 },
    );
  }

  try {
    await addMutedWord({
      userId: auth.userId,
      word: parsed.data.word,
      accessToken: auth.accessToken,
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[POST /api/v1/muted-words] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[POST /api/v1/muted-words] detail:", error);
    }
    return NextResponse.json(
      {
        error: {
          code: "SERVER",
          message: "ミュートワードの追加に失敗しました。",
        },
      },
      { status: 500 },
    );
  }
}
