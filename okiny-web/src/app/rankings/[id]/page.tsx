"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { usePageTransition } from "@/components/page-transition-provider";
import { useToast } from "@/components/toast-provider";
import { useSessionUser } from "@/hooks/use-session-user";
import { DEMO_RANKING, DEMO_RANKING_ID } from "@/lib/demo-ranking";
import { formatSmartDate } from "@/lib/format-date";
import { publishedApiClient } from "@/lib/publish/client";
import { PublishedApiError } from "@/lib/publish/http-published-api-client";
import { getTagLabel } from "@/lib/tags";
import type { PublishedRanking } from "@/lib/types";

export default function RankingDetailPage() {
  const params = useParams<{ id: string }>();
  const rankingId = params.id;
  const router = useRouter();
  const { isReady, user } = useSessionUser();
  const { pushToast } = useToast();
  const { signalReady } = usePageTransition();

  const [isLoading, setIsLoading] = useState(true);
  const [ranking, setRanking] = useState<PublishedRanking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (!user) {
      return;
    }
    if (rankingId === DEMO_RANKING_ID) {
      setRanking(DEMO_RANKING);
      setErrorMessage(null);
      setIsLoading(false);
      signalReady();
      return;
    }

    let canceled = false;
    setIsLoading(true);
    setErrorMessage(null);

    void publishedApiClient
      .getPublishedRanking(rankingId)
      .then((data) => {
        if (canceled) return;
        setRanking(data);
      })
      .catch((error: unknown) => {
        if (canceled) return;
        const message =
          error instanceof PublishedApiError
            ? error.message
            : "ランキング詳細の読み込みに失敗しました。";
        setErrorMessage(message);
        pushToast({ type: "error", message });
      })
      .finally(() => {
        if (canceled) return;
        setIsLoading(false);
        signalReady();
      });

    return () => {
      canceled = true;
    };
  }, [isReady, pushToast, rankingId, signalReady, user]);

  return (
    <AppShell>
      {isLoading ? null : errorMessage ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive">
          {errorMessage}
        </div>
      ) : ranking ? (
        <div className="space-y-4">
          {/* Header row: back + title + menu */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => router.push("/rankings")}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-transparent text-lg font-bold text-foreground"
              aria-label="戻る"
            >
              {"\u2190"}
            </button>
            <div className="flex-1 justify-center">
              <h1 className="truncate text-center text-xl font-bold text-foreground">
                {ranking.title}
              </h1>
            </div>
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-xl font-black text-foreground transition hover:bg-muted"
                aria-label="メニュー"
              >
                <span className="leading-none">{"\u22EF"}</span>
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-card py-1 shadow-md">
                    <Link
                      href={`/rankings/${ranking.id}/edit`}
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-4 py-2 text-left text-sm text-foreground transition hover:bg-muted"
                    >
                      編集
                    </Link>
                    <Link
                      href={`/rankings/${ranking.id}/delete`}
                      onClick={() => setMenuOpen(false)}
                      className="block w-full px-4 py-2 text-left text-sm text-destructive transition hover:bg-muted"
                    >
                      削除
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tag + date */}
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {getTagLabel(ranking.tagId)}
            </span>
            <span className="text-sm text-muted-foreground">
              {formatSmartDate(ranking.createdAt)}
            </span>
          </div>

          {/* Ranking items */}
          <div className="rounded-xl overflow-hidden bg-card">
            {ranking.items.map((item, index) => {
              const rank = index + 1;
              const isFirst = rank === 1;

              return (
                <div
                  key={`${ranking.id}-${index}`}
                  className="flex items-center gap-3 px-6 py-3"
                  style={{ borderBottom: index < ranking.items.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <span
                    className={`w-8 text-center ${isFirst ? "text-2xl font-bold" : "text-base font-semibold"}`}
                    style={{
                      color: isFirst
                        ? "var(--primary)"
                        : "var(--muted-foreground)",
                    }}
                  >
                    {rank}
                  </span>
                  <span
                    className={isFirst ? "text-base font-bold text-foreground" : "text-sm text-foreground"}
                  >
                    {item}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
