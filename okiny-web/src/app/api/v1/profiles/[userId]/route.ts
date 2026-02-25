import { NextResponse } from "next/server";

import { getUserProfile } from "@/lib/social/mock-social-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const url = new URL(request.url);
  const viewerUserId = url.searchParams.get("viewerUserId") ?? "";
  const { userId } = await params;

  if (!viewerUserId) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "viewerUserId クエリパラメータは必須です。" } },
      { status: 422 },
    );
  }

  const profile = getUserProfile({ viewerUserId, userId });
  if (!profile) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "プロフィールが見つかりません。" } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: profile });
}
