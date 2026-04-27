import { NextResponse } from "next/server";
import { z } from "zod";

import {
  authErrorResponse,
  getAuthenticatedUserId,
} from "@/lib/supabase/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { deleteRankingComment } from "@/lib/supabase-rest";

const deleteCommentSchema = z.object({
  commentId: z.string().uuid("コメントIDはUUID形式で指定してください。"),
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return authErrorResponse(auth);
  }
  const { userId, accessToken } = auth;

  const rateLimitResult = await checkRateLimit(`comment-delete:${userId}`, 30);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT", message: "リクエストが多すぎます。しばらく待ってから再試行してください。" } },
      { status: 429 },
    );
  }

  const { id: rankingId } = await params;

  const url = new URL(request.url);
  const parsed = deleteCommentSchema.safeParse({
    commentId: url.searchParams.get("commentId") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Invalid input." } },
      { status: 422 },
    );
  }

  try {
    await deleteRankingComment({
      rankingId,
      commentId: parsed.data.commentId,
      userId,
      accessToken,
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/v1/rankings/:id/comment] failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[DELETE /api/v1/rankings/:id/comment] detail:", error);
    }
    return NextResponse.json(
      { error: { code: "SERVER", message: "コメントの削除に失敗しました。" } },
      { status: 500 },
    );
  }
}
