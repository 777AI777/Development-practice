/**
 * オンボーディング状態の判定ユーティリティ
 * middleware.ts と auth/callback/route.ts で共通利用
 */

type UserMetadata = Record<string, unknown> | undefined;

/** onboarded !== true の場合 true */
export function needsOnboarding(userMetadata?: UserMetadata): boolean {
  return userMetadata?.onboarded !== true;
}

/** onboarded === true かつ display_user_id が falsy の場合 true */
export function needsProfileSetup(userMetadata?: UserMetadata): boolean {
  if (userMetadata?.onboarded !== true) return false;
  const displayUserId = userMetadata.display_user_id;
  return !displayUserId || typeof displayUserId !== "string" || displayUserId === "";
}

/** middleware/callback で使う統合判定 */
export function shouldRedirectToOnboarding(
  userMetadata?: UserMetadata,
): boolean {
  return needsOnboarding(userMetadata) || needsProfileSetup(userMetadata);
}
