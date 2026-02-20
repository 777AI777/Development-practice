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
      { error: { code: "VALIDATION", message: "viewerUserId query parameter is required." } },
      { status: 422 },
    );
  }

  const profile = getUserProfile({ viewerUserId, userId });
  if (!profile) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Profile not found." } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: profile });
}
