import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/back-button";
import { getAuthenticatedUserId } from "@/lib/supabase/auth-guard";
import { ThemeToggle } from "@/components/theme-toggle";

const SETTINGS_ITEMS = [
  {
    href: "/settings/muted-users",
    label: "ミュートしたユーザー",
  },
  {
    href: "/settings/blocked-users",
    label: "ブロックしたユーザー",
  },
  {
    href: "/settings/logout",
    label: "ログアウト",
    destructive: true,
  },
] as const;

export default async function SettingsPage() {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    redirect("/");
  }

  return (
    <AppShell>
      <div className="mb-4 flex items-center gap-2">
        <BackButton href="/rankings" />
        <h1 className="text-lg font-bold text-foreground">設定</h1>
      </div>

      <div className="mb-4">
        <ThemeToggle />
      </div>

      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {SETTINGS_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex items-center justify-between px-4 py-3.5 transition hover:bg-muted ${
                "destructive" in item && item.destructive
                  ? "text-destructive"
                  : "text-foreground"
              }`}
            >
              <span className="text-sm font-medium">{item.label}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-muted-foreground"
              >
                <path
                  d="M6 12L10 8L6 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
