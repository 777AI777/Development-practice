export const DISPLAY_USER_ID_MIN_LENGTH = 3;
export const DISPLAY_USER_ID_MAX_LENGTH = 20;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DISPLAY_USER_ID_PATTERN = new RegExp(
  `^[a-z0-9_]{${DISPLAY_USER_ID_MIN_LENGTH},${DISPLAY_USER_ID_MAX_LENGTH}}$`,
);

export function getUserInitial(name: string | undefined, fallback = ""): string {
  if (!name) return fallback;
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function normalizeDisplayUserId(value: string): string {
  return value.trim().toLowerCase();
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

export function isValidDisplayUserId(value: string): boolean {
  return DISPLAY_USER_ID_PATTERN.test(normalizeDisplayUserId(value));
}

export function isValidUserProfileIdentifier(value: string): boolean {
  const trimmed = value.trim();
  return isUuid(trimmed) || isValidDisplayUserId(trimmed);
}

export function toUserProfileLookup(
  value: string,
): { column: "id" | "display_user_id"; value: string } | null {
  const trimmed = value.trim();
  if (isUuid(trimmed)) {
    return { column: "id", value: trimmed };
  }

  const normalized = normalizeDisplayUserId(trimmed);
  if (isValidDisplayUserId(normalized)) {
    return { column: "display_user_id", value: normalized };
  }

  return null;
}

export function buildUserProfilePath(profile: {
  id: string;
  displayUserId?: string | null;
}): string {
  return `/users/${profile.displayUserId ?? profile.id}`;
}

export function parseDisplayUserIdSearchQuery(query: string): string | null {
  const trimmed = query.trim();
  if (!trimmed.startsWith("@")) {
    return null;
  }

  const candidate = normalizeDisplayUserId(trimmed.slice(1));
  return isValidDisplayUserId(candidate) ? candidate : null;
}
