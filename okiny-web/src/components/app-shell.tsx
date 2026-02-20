"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useSessionUser } from "@/hooks/use-session-user";
import { ENABLE_SNS_EXPANSION, SHOW_STATE_SCREENS } from "@/lib/features";
import { SCREEN_ROUTES } from "@/lib/route-map";

interface AppShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

function routeClass(pathname: string, href: string): string {
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return active
    ? "rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white"
    : "rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50";
}

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isReady, user } = useSessionUser();

  useEffect(() => {
    if (isReady && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isReady, pathname, router, user]);

  if (!isReady) {
    return <div className="min-h-screen bg-slate-100 p-8 text-slate-700">Loading session...</div>;
  }

  if (!user && pathname !== "/login") {
    return null;
  }

  const coreRoutes = SCREEN_ROUTES.filter(
    (route) => route.group === "main" && route.href !== "/login",
  );
  const snsRoutes = SCREEN_ROUTES.filter((route) => route.group === "sns");
  const stateRoutes = SCREEN_ROUTES.filter((route) => route.group === "states");

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href={ENABLE_SNS_EXPANSION ? "/feed" : "/rankings"}
            className="text-xl font-bold text-slate-900"
          >
            OKINY
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
            >
              Settings
            </Link>
            {user ? (
              <Link
                href="/settings/logout"
                className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Account ({user.name})
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          <p className="mt-2 text-xs text-slate-500">
            Signed in user: {user ? `${user.name} (${user.id})` : "none"}
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Core Screens
          </p>
          <div className="flex flex-wrap gap-2">
            {coreRoutes.map((route) => (
              <Link key={route.href} href={route.href} className={routeClass(pathname, route.href)}>
                {route.label}
              </Link>
            ))}
          </div>
          {ENABLE_SNS_EXPANSION ? (
            <>
              <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                SNS Expansion
              </p>
              <div className="flex flex-wrap gap-2">
                {snsRoutes.map((route) => (
                  <Link key={route.href} href={route.href} className={routeClass(pathname, route.href)}>
                    {route.label}
                  </Link>
                ))}
              </div>
            </>
          ) : null}
          {SHOW_STATE_SCREENS ? (
            <>
              <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                State Screens (Dev)
              </p>
              <div className="flex flex-wrap gap-2">
                {stateRoutes.map((route) => (
                  <Link key={route.href} href={route.href} className={routeClass(pathname, route.href)}>
                    {route.label}
                  </Link>
                ))}
              </div>
            </>
          ) : null}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          {children}
        </section>
      </main>
    </div>
  );
}
