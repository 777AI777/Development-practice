import { NextResponse } from "next/server";

import {
  listDiscoveryTags,
  listFeed,
  listRecommendedUsers,
} from "@/lib/social/mock-social-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? "";
  const tabParam = url.searchParams.get("tab");
  const cursor = url.searchParams.get("cursor") ?? undefined;

  if (!userId) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "userId query parameter is required." } },
      { status: 422 },
    );
  }

  const tab = tabParam === "following" ? "following" : "for-you";
  const feed = listFeed({ userId, tab, cursor });
  return NextResponse.json({
    data: {
      ...feed,
      discovery: {
        tags: listDiscoveryTags(),
        users: listRecommendedUsers(userId),
      },
    },
  });
}
