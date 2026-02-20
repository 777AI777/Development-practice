"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useSessionUser } from "@/hooks/use-session-user";
import { SHOW_STATE_SCREENS } from "@/lib/features";
import {
  HttpPublishedApiClient,
  PublishedApiError,
} from "@/lib/publish/http-published-api-client";
import type { PublishedRanking } from "@/lib/types";

const apiClient = new HttpPublishedApiClient();

export default function RankingsPage() {
  const searchParams = useSearchParams();
  const requestedState = searchParams.get("state");
  const { user } = useSessionUser();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rankings, setRankings] = useState<PublishedRanking[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (requestedState === "loading") {
      setIsLoading(true);
      return;
    }
    if (requestedState === "error") {
      setIsLoading(false);
      setErrorMessage("Simulated error state.");
      setRankings([]);
      return;
    }
    if (requestedState === "empty") {
      setIsLoading(false);
      setErrorMessage(null);
      setRankings([]);
      return;
    }

    let canceled = false;
    setIsLoading(true);
    setErrorMessage(null);
    void apiClient
      .listPublishedRankings(user.id)
      .then((data) => {
        if (canceled) return;
        setRankings(data);
      })
      .catch((error: unknown) => {
        if (canceled) return;
        const message =
          error instanceof PublishedApiError
            ? error.message
            : "Failed to load ranking list.";
        setErrorMessage(message);
      })
      .finally(() => {
        if (canceled) return;
        setIsLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [requestedState, user]);

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      );
    }

    if (errorMessage) {
      return (
        <div className="space-y-3">
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
          {SHOW_STATE_SCREENS ? (
            <div className="flex flex-wrap gap-2">
              <Link href="/states/error-catalog" className="rounded-md bg-red-700 px-3 py-2 text-sm text-white">
                Open Error Catalog (12)
              </Link>
              <Link href="/states/not-found" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                Open Not Found (15)
              </Link>
            </div>
          ) : null}
        </div>
      );
    }

    if (rankings.length === 0) {
      return (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-sm text-slate-600">
            No rankings yet. This corresponds to mock 09 Empty List State.
          </p>
          <Link
            href="/rankings/new"
            className="inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Create your first ranking
          </Link>
        </div>
      );
    }

    return (
      <ul className="space-y-3">
        {rankings.map((ranking) => (
          <li key={ranking.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-lg font-bold text-slate-900">{ranking.title}</p>
            <p className="mt-1 text-xs text-slate-600">
              tag: {ranking.tagId} / updated: {new Date(ranking.updatedAt).toLocaleString()}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/rankings/${ranking.id}`}
                className="rounded-md border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700"
              >
                Detail
              </Link>
              <Link
                href={`/rankings/${ranking.id}/edit`}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold"
              >
                Edit
              </Link>
              <Link
                href={`/rankings/${ranking.id}/delete`}
                className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700"
              >
                Delete
              </Link>
            </div>
          </li>
        ))}
      </ul>
    );
  }, [errorMessage, isLoading, rankings]);

  return (
    <AppShell
      title="My Rankings"
      subtitle="Create, edit, delete, and browse rankings. This corresponds to mock 02."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Link href="/rankings/new" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
            New Ranking
          </Link>
          <Link href="/search" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">
            Tag Search (05)
          </Link>
          <Link href="/drafts" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">
            Drafts (06)
          </Link>
        </div>
        {SHOW_STATE_SCREENS ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              State shortcuts (dev)
            </span>
            <Link href="/rankings?state=empty" className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold">
              Empty (09)
            </Link>
            <Link href="/rankings?state=loading" className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold">
              Loading (13)
            </Link>
            <Link href="/rankings?state=error" className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold">
              Error (12)
            </Link>
          </div>
        ) : null}
        {content}
      </div>
    </AppShell>
  );
}
