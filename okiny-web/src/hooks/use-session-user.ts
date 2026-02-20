"use client";

import { useEffect, useMemo, useState } from "react";

import { MOCK_USERS, type MockUser } from "@/lib/mock-users";
import {
  getDisplayNameMap,
  getMockUserById,
  SESSION_USER_ID_KEY,
  setDisplayName,
} from "@/lib/session";

interface UseSessionUserResult {
  isReady: boolean;
  user: MockUser | null;
  signInAs: (userId: string) => void;
  signOut: () => void;
  updateDisplayName: (displayName: string) => void;
}

export function useSessionUser(): UseSessionUserResult {
  const [isReady, setIsReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayNameMap, setDisplayNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const value = window.localStorage.getItem(SESSION_USER_ID_KEY);
    setUserId(value);
    setDisplayNameMap(getDisplayNameMap());
    setIsReady(true);
  }, []);

  const user = useMemo(() => {
    if (!userId) {
      return null;
    }
    const baseUser = getMockUserById(userId) ?? null;
    if (!baseUser) {
      return null;
    }
    const displayName = displayNameMap[userId];
    if (!displayName) {
      return baseUser;
    }
    return {
      ...baseUser,
      name: displayName,
    };
  }, [displayNameMap, userId]);

  const signInAs = (nextUserId: string) => {
    const target = getMockUserById(nextUserId) ?? MOCK_USERS[0];
    if (!target) {
      return;
    }
    window.localStorage.setItem(SESSION_USER_ID_KEY, target.id);
    setUserId(target.id);
  };

  const signOut = () => {
    window.localStorage.removeItem(SESSION_USER_ID_KEY);
    setUserId(null);
  };

  const updateDisplayName = (displayName: string) => {
    if (!userId) {
      return;
    }
    const normalized = displayName.trim();
    if (!normalized) {
      return;
    }
    setDisplayName(userId, normalized);
    setDisplayNameMap((prev) => ({
      ...prev,
      [userId]: normalized,
    }));
  };

  return { isReady, user, signInAs, signOut, updateDisplayName };
}
