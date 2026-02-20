import { z } from "zod";
import { NextResponse } from "next/server";

import { followUser, unfollowUser } from "@/lib/social/mock-social-store";

const bodySchema = z.object({
  followerUserId: z.string().min(1),
});

async function parseBody(request: Request) {
  try {
    const payload = await request.json();
    return bodySchema.safeParse(payload);
  } catch {
    return bodySchema.safeParse({});
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const parsed = await parseBody(request);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "followerUserId is required." } },
      { status: 422 },
    );
  }
  const { userId } = await params;
  followUser({ followerUserId: parsed.data.followerUserId, targetUserId: userId });
  return NextResponse.json({ data: { ok: true } });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const parsed = await parseBody(request);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "followerUserId is required." } },
      { status: 422 },
    );
  }
  const { userId } = await params;
  unfollowUser({ followerUserId: parsed.data.followerUserId, targetUserId: userId });
  return NextResponse.json({ data: { ok: true } });
}
