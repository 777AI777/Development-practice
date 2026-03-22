"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { usePageTransition } from "@/components/page-transition-provider";
import { formatSmartDate } from "@/lib/format-date";
import type { PublishedRanking } from "@/lib/types";

interface RankingDetailContentProps {
  ranking: PublishedRanking;
}

export function RankingDetailContent({ ranking }: RankingDetailContentProps) {
  const router = useRouter();
  const { signalReady } = usePageTransition();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleShareToX = useCallback(() => {
    const shareUrl = `${window.location.origin}/share/rankings/${ranking.id}`;
    const tagText = ranking.tagName ? `「${ranking.tagName}」` : "";
    const text = `わたしの${tagText}ランキング！\n#OKINY\n`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  }, [ranking.id, ranking.tagName]);

  useEffect(() => {
    signalReady();
  }, [signalReady]);

  return (
    <AppShell>
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
            {ranking.tagName ?? ranking.tagId}
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
                style={{
                  borderBottom:
                    index < ranking.items.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                }}
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
                  className={
                    isFirst
                      ? "text-base font-bold text-foreground"
                      : "text-sm text-foreground"
                  }
                >
                  {item}
                </span>
              </div>
            );
          })}
        </div>

        {/* X share button */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleShareToX}
            className="inline-flex items-center gap-2 rounded-lg bg-[#000000] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#333333]"
          >
            <span className="text-base leading-none">𝕏</span>
            <span>Xで共有する</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}
