"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { AuthUser } from "@/lib/supabase/types";

// モジュールレベルキャッシュ（ページ遷移間で保持、ハードリフレッシュでリセット）
let cachedUser: AuthUser | null = null;
let cachedIsReady = false;

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
  const [isReady, setIsReady] = useState(cachedIsReady);
  const [user, setUser] = useState<AuthUser | null>(cachedUser);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      const userData = currentUser ? toAuthUser(currentUser) : null;
      cachedUser = userData;
      cachedIsReady = true;
      setUser(userData);
      setIsReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const userData = session?.user ? toAuthUser(session.user) : null;
      if (_event === "SIGNED_OUT") {
        cachedUser = null;
        cachedIsReady = false;
      } else {
        cachedUser = userData;
        cachedIsReady = true;
      }
      setUser(userData);
      setIsReady(true);
    });

    // 他タブからのログアウト通知を受信
    let authChannel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      authChannel = new BroadcastChannel("okiny-auth-sync");
      authChannel.onmessage = (event: MessageEvent) => {
        if (event.data.type === "SIGNED_OUT") {
          cachedUser = null;
          cachedIsReady = true;
          setUser(null);
          setIsReady(true);
        }
      };
    }

    return () => {
      subscription.unsubscribe();
      authChannel?.close();
    };
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    cachedUser = null;
    cachedIsReady = false;
    setUser(null);

    // 他タブに通知
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("okiny-auth-sync");
      channel.postMessage({ type: "SIGNED_OUT" });
      channel.close();
    }
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
