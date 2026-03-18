"use client";

import { useEffect, useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";
import type { AuthUser } from "@/lib/supabase/types";

// モジュールレベルキャッシュ（ページ遷移間で保持、ハードリフレッシュでリセット）
let cachedUser: AuthUser | null = null;
let cachedIsReady = false;

/** キャッシュ更新を単一関数に集約（競合リスク軽減） */
function updateCache(user: AuthUser | null, ready: boolean): void {
  cachedUser = user;
  cachedIsReady = ready;
}

interface AuthSyncMessage {
  type: "SIGNED_OUT";
}

interface UseSessionUserResult {
  isReady: boolean;
  user: AuthUser | null;
  signOut: () => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<boolean>;
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

    void supabase.auth
      .getUser()
      .then(({ data: { user: currentUser } }) => {
        const userData = currentUser ? toAuthUser(currentUser) : null;
        updateCache(userData, true);
        setUser(userData);
        setIsReady(true);
      })
      .catch(() => {
        updateCache(null, true);
        setUser(null);
        setIsReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const userData = session?.user ? toAuthUser(session.user) : null;
      if (_event === "SIGNED_OUT") {
        updateCache(null, false);
      } else {
        updateCache(userData, true);
      }
      setUser(userData);
      setIsReady(true);

      if (_event === "SIGNED_IN" && userData) {
        const loginProvider = sessionStorage.getItem("okiny:login_pending");
        if (loginProvider) {
          sessionStorage.removeItem("okiny:login_pending");
          trackEvent("login_success", {
            user_id: userData.id,
            provider: loginProvider,
            entry_route: window.location.pathname,
          });
        }
      }
    });

    // 他タブからのログアウト通知を受信
    let authChannel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      authChannel = new BroadcastChannel("okiny-auth-sync");
      authChannel.onmessage = (event: MessageEvent<AuthSyncMessage>) => {
        if (event.data.type === "SIGNED_OUT") {
          updateCache(null, true);
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
    updateCache(null, false);
    setUser(null);

    // 他タブに通知
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("okiny-auth-sync");
      channel.postMessage({ type: "SIGNED_OUT" });
      channel.close();
    }
  };

  const updateDisplayName = async (
    displayName: string,
  ): Promise<boolean> => {
    const MAX_DISPLAY_NAME_LENGTH = 30;
    const normalized = displayName.trim();
    if (!normalized || normalized.length > MAX_DISPLAY_NAME_LENGTH)
      return false;
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.updateUser({
        data: { display_name: normalized },
      });
      if (data.user) {
        const updatedUser = toAuthUser(data.user);
        updateCache(updatedUser, true);
        setUser(updatedUser);
      }
      return true;
    } catch {
      return false;
    }
  };

  return { isReady, user, signOut, updateDisplayName };
}
