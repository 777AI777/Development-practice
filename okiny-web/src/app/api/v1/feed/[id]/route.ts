import { NextResponse } from "next/server";

import { getFeedItemByRankingId } from "@/lib/social/mock-social-store";

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

  const item = getFeedItemByRankingId(id, userId);
  if (!item) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "フィード項目が見つかりません。" } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: item });
}
