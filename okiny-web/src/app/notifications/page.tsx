"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { ENABLE_SNS_EXPANSION } from "@/lib/features";

const SAMPLE_NOTIFICATIONS = [
  {
    id: "notice-001",
    type: "reaction",
    message: "あなたの「映画トップ5」に新しいLikeが付きました。",
    href: "/feed/demo",
  },
  {
    id: "notice-002",
    type: "follow",
    message: "Hanako Sato さんがあなたをフォローしました。",
    href: "/profile/user-google-002",
  },
  {
    id: "notice-003",
    type: "comment",
    message: "新しいコメントがあります。",
    href: "/feed/demo",
  },
];

export default function NotificationsPage() {
  if (!ENABLE_SNS_EXPANSION) {
    return (
      <AppShell title="Notifications" subtitle="SNS expansion is disabled.">
        <p className="text-sm text-slate-600">Enable NEXT_PUBLIC_ENABLE_SNS_EXPANSION=true to use notification routes.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Notifications"
      subtitle="フォロー・反応・コメント通知を集約し、再訪を促す通知センター。"
    >
      <div className="space-y-3">
        {SAMPLE_NOTIFICATIONS.map((notice) => (
          <Link
            key={notice.id}
            href={notice.href}
            className="block rounded-md border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-slate-100"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{notice.type}</p>
            <p className="mt-1 text-sm text-slate-800">{notice.message}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
