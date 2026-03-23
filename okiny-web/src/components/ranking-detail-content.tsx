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
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleToggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
    setShareMenuOpen(false);
  }, []);

  const handleToggleShareMenu = useCallback(() => {
    setShareMenuOpen((prev) => !prev);
    setMenuOpen(false);
  }, []);

  const handleShareToX = useCallback(() => {
    const shareUrl = `${window.location.origin}/share/rankings/${ranking.id}`;
    const tagText = ranking.tagName ? `「${ranking.tagName}」` : "";
    const text = `わたしの${tagText}ランキング！\n#OKINY\n`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
    setShareMenuOpen(false);
  }, [ranking.id, ranking.tagName]);

  const handleCopyLink = useCallback(async () => {
    const shareUrl = `${window.location.origin}/share/rankings/${ranking.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
    } catch {
      /* clipboard API unavailable — silent fail */
    }
    setShareMenuOpen(false);
  }, [ranking.id]);

  useEffect(() => {
    if (!linkCopied) return;
    const timer = setTimeout(() => setLinkCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [linkCopied]);

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
          <div className="flex flex-shrink-0 items-center gap-1">
            {/* Share button */}
            <div className="relative">
              <button
                type="button"
                onClick={handleToggleShareMenu}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-foreground transition hover:bg-muted"
                aria-label="共有"
              >
                {linkCopied ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                )}
              </button>
              {shareMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShareMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-border bg-card py-1 shadow-md">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition hover:bg-muted"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      リンクをコピー
                    </button>
                    <button
                      type="button"
                      onClick={handleShareToX}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition hover:bg-muted"
                    >
                      <span className="inline-flex w-[14px] justify-center text-sm font-bold leading-none">𝕏</span>
                      Xで共有
                    </button>
                  </div>
                </>
              )}
            </div>
            {/* Menu button */}
            <div className="relative">
              <button
                type="button"
                onClick={handleToggleMenu}
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

      </div>
    </AppShell>
  );
}
