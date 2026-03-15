"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { AuthUser } from "@/lib/supabase/types";

interface UseSessionUserResult {
  isReady: boolean;
  user: AuthUser | null;
  signOut: () => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
}

function safeString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function toAuthUser(supabaseUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): AuthUser {
  const meta = supabaseUser.user_metadata ?? {};
  return {
    id: supabaseUser.id,
    name:
      safeString(meta.display_name) ??
      safeString(meta.full_name) ??
      safeString(meta.name) ??
      "Unknown",
    email: supabaseUser.email ?? "",
    avatarUrl: safeString(meta.avatar_url),
  };
}

export function useSessionUser(): UseSessionUserResult {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser ? toAuthUser(currentUser) : null);
      setIsReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toAuthUser(session.user) : null);
      setIsReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateDisplayName = async (displayName: string) => {
    const MAX_DISPLAY_NAME_LENGTH = 30;
    const normalized = displayName.trim();
    if (!normalized || normalized.length > MAX_DISPLAY_NAME_LENGTH) return;
    const supabase = createClient();
    const { data } = await supabase.auth.updateUser({
      data: { display_name: normalized },
    });
    if (data.user) {
      setUser(toAuthUser(data.user));
    }
  };

  return { isReady, user, signOut, updateDisplayName };
}
