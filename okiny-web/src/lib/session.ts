import { MOCK_USERS, type MockUser } from "@/lib/mock-users";

export const SESSION_USER_ID_KEY = "okiny:session:userId";
export const SESSION_DISPLAY_NAME_MAP_KEY = "okiny:session:displayNameMap";

export function getMockUserById(userId: string): MockUser | undefined {
  return MOCK_USERS.find((user) => user.id === userId);
}

export function getDisplayNameMap(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }
  const raw = window.localStorage.getItem(SESSION_DISPLAY_NAME_MAP_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function getSessionUserId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(SESSION_USER_ID_KEY);
}

export function setDisplayName(userId: string, displayName: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const current = getDisplayNameMap();
  const next = { ...current, [userId]: displayName };
  window.localStorage.setItem(SESSION_DISPLAY_NAME_MAP_KEY, JSON.stringify(next));
}
