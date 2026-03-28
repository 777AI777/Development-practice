import { NextResponse } from "next/server";

import { displayUserIdSchema } from "@/lib/profile-validation";
import { checkDisplayUserIdAvailability } from "@/lib/supabase-rest";
import {
  authErrorResponse,
  getAuthenticatedUserId,
} from "@/lib/supabase/auth-guard";

export async function GET(request: Request) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }

  const url = new URL(request.url);
  const rawDisplayUserId = url.searchParams.get("displayUserId") ?? "";

  const parsed = displayUserIdSchema.safeParse(rawDisplayUserId);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message:
            parsed.error.issues[0]?.message ?? "Invalid displayUserId.",
        },
      },
      { status: 422 },
    );
  }

  const normalizedDisplayUserId = parsed.data;

  try {
    const available =
      await checkDisplayUserIdAvailability(normalizedDisplayUserId);

    return NextResponse.json({ data: { available } });
  } catch (error) {
    console.error("[GET /api/v1/users/check-availability] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "[GET /api/v1/users/check-availability] detail:",
        error,
      );
    }
    return NextResponse.json(
      {
        error: {
          code: "SERVER",
          message: "ユーザーIDの確認に失敗しました。",
        },
      },
      { status: 500 },
    );
  }
}
