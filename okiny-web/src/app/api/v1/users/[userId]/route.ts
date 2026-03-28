import { NextResponse } from "next/server";
import { z } from "zod";

import { listPublicRankingsByUser } from "@/lib/supabase-rest";
import { getUserProfileWithFallback } from "@/lib/user-profile-with-fallback";
import { isValidUserProfileIdentifier } from "@/lib/user-utils";

const paramsSchema = z.object({
  userId: z
    .string()
    .trim()
    .refine(
      (value) => isValidUserProfileIdentifier(value),
      "User ID must be a UUID or a display user ID.",
    ),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  const parsedParams = paramsSchema.safeParse({ userId });
  if (!parsedParams.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: parsedParams.error.issues[0]?.message ?? "Invalid user ID.",
        },
      },
      { status: 422 },
    );
  }

  try {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
      return NextResponse.json(
        { error: { code: "SERVER", message: "Server configuration is missing." } },
        { status: 500 },
      );
    }

    const profile = await getUserProfileWithFallback(userId);
    if (!profile) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found." } },
        { status: 404 },
      );
    }

    const rankings = await listPublicRankingsByUser({
      userId: profile.id,
      accessToken: anonKey,
    });

    return NextResponse.json({
      data: {
        profile,
        rankings,
      },
    });
  } catch (error) {
    console.error("[GET /api/v1/users/:userId] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/v1/users/:userId] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "Failed to load user profile." } },
      { status: 500 },
    );
  }
}
