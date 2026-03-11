"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useSessionUser } from "@/hooks/use-session-user";

const APP_BRAND = "OKINY";

interface AppShellProps {
  title: string;
  subtitle: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

function AccountIcon() {
  return (
    <span className="relative block h-5 w-5" aria-hidden="true">
      <span className="absolute left-1/2 top-0 h-[6px] w-[6px] -translate-x-1/2 rounded-full bg-[#1A1A1A]" />
      <span className="absolute bottom-0 left-1/2 h-[8px] w-[12px] -translate-x-1/2 rounded-t-full rounded-b-md bg-[#1A1A1A]" />
    </span>
  );
}

export function AppShell({ title, headerActions, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isReady, user } = useSessionUser();

  useEffect(() => {
    if (isReady && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isReady, pathname, router, user]);

  if (!isReady) {
    return <div className="min-h-screen bg-slate-100 p-8 text-slate-700">セッションを読み込み中...</div>;
  }

  if (!user && pathname !== "/login") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7] text-[#1A1A1A]">
      <header className="border-b border-[#C4CDD5] bg-white">
        <div className="mx-auto flex h-[72px] w-full max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/rankings" className="text-lg font-bold tracking-tight sm:text-2xl">
            {APP_BRAND}
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/settings"
              aria-label="設定"
              title="設定"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-xl leading-none hover:bg-slate-100"
            >
              <span aria-hidden="true">{"\u2699"}</span>
            </Link>
            <Link
              href="/settings/logout"
              aria-label={user ? `${user.name} のアカウント` : "アカウント"}
              title={user ? `${user.name}` : "アカウント"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100"
            >
              <AccountIcon />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 sm:py-10 lg:px-20 lg:py-12">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[#1A1A1A] sm:text-[32px]">
              {title}
            </h1>
          </div>
          {headerActions ? <div className="shrink-0">{headerActions}</div> : null}
        </section>

        <section className="mt-6">{children}</section>
      </main>
    </div>
  );
}
