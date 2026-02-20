export interface ScreenRoute {
  href: string;
  label: string;
  group: "main" | "sns" | "states";
}

export const SCREEN_ROUTES: ScreenRoute[] = [
  { href: "/login", label: "01 Login", group: "main" },
  { href: "/rankings", label: "02 Ranking List", group: "main" },
  { href: "/rankings/new", label: "03 Ranking Create", group: "main" },
  { href: "/rankings/demo", label: "04 Ranking Detail", group: "main" },
  { href: "/search", label: "05 Tag Search", group: "main" },
  { href: "/drafts", label: "06 Drafts", group: "main" },
  { href: "/settings", label: "07 Settings", group: "main" },
  { href: "/settings/logout", label: "07a Logout Confirm", group: "main" },
  { href: "/rankings/demo/delete", label: "08 Delete Confirm", group: "main" },
  { href: "/onboarding", label: "Onboarding", group: "sns" },
  { href: "/feed", label: "Home Feed", group: "sns" },
  { href: "/composer", label: "Composer", group: "sns" },
  { href: "/composer/preview", label: "Publish Preview", group: "sns" },
  { href: "/feed/demo", label: "Post Detail", group: "sns" },
  { href: "/profile/user-google-001", label: "Profile", group: "sns" },
  { href: "/notifications", label: "Notifications", group: "sns" },
  { href: "/states/empty-list", label: "09 Empty List", group: "states" },
  { href: "/states/empty-search", label: "10 Empty Search", group: "states" },
  { href: "/states/empty-drafts", label: "11 Empty Drafts", group: "states" },
  { href: "/states/error-catalog", label: "12 Error States", group: "states" },
  { href: "/states/loading", label: "13 Loading", group: "states" },
  { href: "/states/auth-error", label: "14 Auth Error", group: "states" },
  { href: "/states/not-found", label: "15 Not Found", group: "states" },
  { href: "/states/draft-limit", label: "16 Draft Limit", group: "states" },
  { href: "/states/toast-rules", label: "17 Toast Rules", group: "states" },
  { href: "/states/transition-check", label: "18 Transition Check", group: "states" },
  { href: "/states/common-header", label: "19 Common Header", group: "states" },
];
