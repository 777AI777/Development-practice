"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";

interface StateScreenProps {
  title: string;
  subtitle: string;
  bullets: string[];
  actionHref?: string;
  actionLabel?: string;
}

export function StateScreen({
  title,
  subtitle,
  bullets,
  actionHref,
  actionLabel,
}: StateScreenProps) {
  return (
    <AppShell title={title} subtitle={subtitle}>
      <div className="space-y-4">
        <ul className="space-y-2">
          {bullets.map((line) => (
            <li
              key={line}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              {line}
            </li>
          ))}
        </ul>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </AppShell>
  );
}

