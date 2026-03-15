import { createClient } from "@/lib/supabase/server";

export type AuthResult =
  | { ok: true; userId: string; accessToken: string }
  | { ok: false; reason: "unauthorized" | "server_error" };

export async function getAuthenticatedUserId(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("[auth-guard] getUser failed");
    if (process.env.NODE_ENV !== "production") {
      console.error("[auth-guard] detail:", error.message);
    }
    return { ok: false, reason: "server_error" };
  }

  if (!user) {
    return { ok: false, reason: "unauthorized" };
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    console.error("[auth-guard] getSession failed");
    if (process.env.NODE_ENV !== "production" && sessionError) {
      console.error("[auth-guard] session detail:", sessionError.message);
    }
    return { ok: false, reason: "unauthorized" };
  }

  return { ok: true, userId: user.id, accessToken: session.access_token };
}
