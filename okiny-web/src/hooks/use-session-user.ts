"use client";

import { useEffect, useState } from "react";

import type { AuthChangeEvent, Session, User } from "@supabase/auth-js";

import { trackEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";
import type { AuthUser } from "@/lib/supabase/types";
import {
  DISPLAY_USER_ID_MAX_LENGTH,
  isValidDisplayUserId,
  normalizeDisplayUserId,
} from "@/lib/user-utils";

// モジュールレベルキャッシュ（ページ遷移間で保持、ハードリフレッシュでリセット）
let cachedUser: AuthUser | null = null;
let cachedIsReady = false;
let cachedAuthPromise: Promise<AuthUser | null> | null = null;

/** キャッシュ更新を単一関数に集約（競合リスク軽減） */
function updateCache(user: AuthUser | null, ready: boolean, resetPromise = false): void {
  cachedUser = user;
  cachedIsReady = ready;
  if (resetPromise) {
    cachedAuthPromise = null;
  }
}

interface AuthSyncMessage {
  type: "SIGNED_OUT";
}

interface UseSessionUserResult {
  isReady: boolean;
  user: AuthUser | null;
  signOut: () => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<"success" | "invalid" | "server">;
  updateDisplayUserId: (
    displayUserId: string,
  ) => Promise<"success" | "invalid" | "conflict" | "server">;
  updateIntroduction: (introduction: string) => Promise<"success" | "invalid" | "server">;
  updateLinks: (newLinks: Array<{ url: string }>) => Promise<"success" | "invalid" | "server">;
}

function safeString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isConflictErrorMessage(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("duplicate") || message.includes("unique");
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
    displayUserId: safeString(meta.display_user_id) ?? null,
    introduction: safeString(meta.introduction) ?? null,
    links: Array.isArray(meta.links)
      ? (meta.links as unknown[]).filter(
          (l: unknown): l is { url: string } =>
            l !== null &&
            typeof l === "object" &&
            "url" in (l as Record<string, unknown>) &&
            typeof (l as Record<string, string>).url === "string",
        ).slice(0, 5)
      : null,
  };
}

export function useSessionUser(): UseSessionUserResult {
  const [isReady, setIsReady] = useState(cachedIsReady);
  const [user, setUser] = useState<AuthUser | null>(cachedUser);

  useEffect(() => {
    const supabase = createClient();

    if (!cachedAuthPromise) {
      cachedAuthPromise = supabase.auth
        .getUser()
        .then(({ data: { user: currentUser } }: { data: { user: User | null } }) => {
          return currentUser ? toAuthUser(currentUser) : null;
        })
        .catch(() => null);
    }

    void cachedAuthPromise!.then((userData) => {
      updateCache(userData, true);
      setUser(userData);
      setIsReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      const userData = session?.user ? toAuthUser(session.user) : null;
      if (_event === "SIGNED_OUT") {
        updateCache(null, false, true);
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
          updateCache(null, true, true); // Promiseキャッシュもリセット
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
    updateCache(null, false, true);
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
  ): Promise<"success" | "invalid" | "server"> => {
    const MAX_DISPLAY_NAME_LENGTH = 30;
    const normalized = displayName.trim();
    if (!normalized || normalized.length > MAX_DISPLAY_NAME_LENGTH)
      return "invalid";
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.updateUser({
        data: { display_name: normalized },
      });
      if (error) {
        return "server";
      }
      if (data.user) {
        const updatedUser = toAuthUser(data.user);
        updateCache(updatedUser, true);
        setUser(updatedUser);
      }
      return "success";
    } catch {
      return "server";
    }
  };

  const updateDisplayUserId = async (
    displayUserId: string,
  ): Promise<"success" | "invalid" | "conflict" | "server"> => {
    const normalized = normalizeDisplayUserId(displayUserId);
    if (!isValidDisplayUserId(normalized) || normalized.length > DISPLAY_USER_ID_MAX_LENGTH) {
      return "invalid";
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.updateUser({
        data: { display_user_id: normalized },
      });
      if (error) {
        return isConflictErrorMessage(error) ? "conflict" : "server";
      }
      if (data.user) {
        const updatedUser = toAuthUser(data.user);
        updateCache(updatedUser, true);
        setUser(updatedUser);
      }
      return "success";
    } catch (error) {
      return isConflictErrorMessage(error) ? "conflict" : "server";
    }
  };

  const updateIntroduction = async (
    introduction: string,
  ): Promise<"success" | "invalid" | "server"> => {
    const normalized = introduction.trim();
    if (normalized.length > 200) {
      return "invalid";
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.updateUser({
        data: { introduction: normalized || null },
      });
      if (error) {
        return "server";
      }
      if (data.user) {
        const updatedUser = toAuthUser(data.user);
        updateCache(updatedUser, true);
        setUser(updatedUser);
      }
      return "success";
    } catch {
      return "server";
    }
  };

  const updateLinks = async (
    newLinks: Array<{ url: string }>,
  ): Promise<"success" | "invalid" | "server"> => {
    if (newLinks.length > 5) return "invalid";
    for (const link of newLinks) {
      try {
        const parsed = new URL(link.url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return "invalid";
        }
      } catch {
        return "invalid";
      }
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.updateUser({
        data: { links: newLinks.length > 0 ? newLinks : null },
      });
      if (error) {
        return "server";
      }
      if (data.user) {
        const updatedUser = toAuthUser(data.user);
        updateCache(updatedUser, true);
        setUser(updatedUser);
      }
      return "success";
    } catch {
      return "server";
    }
  };

  return {
    isReady,
    user,
    signOut,
    updateDisplayName,
    updateDisplayUserId,
    updateIntroduction,
    updateLinks,
  };
}
