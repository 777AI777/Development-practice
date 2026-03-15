import { createClient } from "@/lib/supabase/server";

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "unauthorized" | "server_error" };

export async function getAuthenticatedUserId(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("[auth-guard] getUser failed:", error.message);
    return { ok: false, reason: "server_error" };
  }

  if (!user) {
    return { ok: false, reason: "unauthorized" };
  }

  return { ok: true, userId: user.id };
}
