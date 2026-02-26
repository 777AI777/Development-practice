type AnalyticsEventName =
  | "login_success"
  | "ranking_create_start"
  | "ranking_publish_success"
  | "draft_save_success"
  | "return_visit_d1"
  | "feed_open"
  | "reaction_sent";

interface AnalyticsRecord {
  event: AnalyticsEventName;
  at: string;
  payload: Record<string, string | number | boolean | null | undefined>;
}

const STORAGE_KEY = "okiny:analytics:events";

export function trackEvent(
  event: AnalyticsEventName,
  payload: Record<string, string | number | boolean | null | undefined>,
): void {
  if (typeof window === "undefined") {
    return;
  }
  const record: AnalyticsRecord = {
    event,
    at: new Date().toISOString(),
    payload,
  };
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? ((JSON.parse(raw) as AnalyticsRecord[]) ?? []) : [];
  const next = [...parsed.slice(-199), record];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  // Keep console output in dev for quick verification.
  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics]", record.event, record.payload);
  }
}
