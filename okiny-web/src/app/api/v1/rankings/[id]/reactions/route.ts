import { z } from "zod";
import { NextResponse } from "next/server";

import { setReaction } from "@/lib/social/mock-social-store";

const bodySchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["like", "save"]),
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
  { params }: { params: Promise<{ id: string }> },
) {
  const parsed = await parseBody(request);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "userId and type are required." } },
      { status: 422 },
    );
  }
  const { id } = await params;
  const data = setReaction({
    userId: parsed.data.userId,
    rankingId: id,
    type: parsed.data.type,
    active: true,
  });
  return NextResponse.json({ data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsed = await parseBody(request);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "userId and type are required." } },
      { status: 422 },
    );
  }
  const { id } = await params;
  const data = setReaction({
    userId: parsed.data.userId,
    rankingId: id,
    type: parsed.data.type,
    active: false,
  });
  return NextResponse.json({ data });
}
