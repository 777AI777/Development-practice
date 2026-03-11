export const ENABLE_SNS_EXPANSION =
  process.env.NEXT_PUBLIC_ENABLE_SNS_EXPANSION === "true";

export const SHOW_STATE_SCREENS =
  process.env.NEXT_PUBLIC_SHOW_STATE_SCREENS === "true" ||
  process.env.NODE_ENV !== "production";
