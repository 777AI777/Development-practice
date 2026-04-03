import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthenticatedUserId } from "@/lib/supabase/auth-guard";

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
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <h1 className="mb-6 text-lg font-bold text-foreground">設定</h1>

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
    </div>
  );
}
