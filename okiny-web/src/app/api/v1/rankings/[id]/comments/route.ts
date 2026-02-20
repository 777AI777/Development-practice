import { z } from "zod";
import { NextResponse } from "next/server";

import { addComment, listComments } from "@/lib/social/mock-social-store";

const createSchema = z.object({
  userId: z.string().min(1),
  body: z.string().trim().min(1),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return NextResponse.json({ data: listComments(id) });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "userId and body are required." } },
      { status: 422 },
    );
  }

  const { id } = await params;
  const data = addComment({
    rankingId: id,
    userId: parsed.data.userId,
    body: parsed.data.body,
  });
  return NextResponse.json({ data }, { status: 201 });
}
