import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";

import { getPublicRanking } from "@/lib/supabase/public-ranking";
import { getAppUrl } from "@/lib/url";

const getCachedPublicRanking = cache(getPublicRanking);

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ranking = await getCachedPublicRanking(id);
  const appUrl = getAppUrl();

  const title = ranking ? `${ranking.title}｜OKINY` : "OKINY";
  const description = ranking
    ? buildDescription(ranking.tagName, ranking.items)
    : "ランキングを共有しよう";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`${appUrl}/api/og/rankings/${id}`],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${appUrl}/api/og/rankings/${id}`],
    },
  };
}

function buildDescription(tagName: string, items: readonly string[]): string {
  const nonEmptyItems = items.filter((item) => item.trim() !== "");
  const preview = nonEmptyItems.slice(0, 3).join(", ");
  const prefix = tagName ? `${tagName}ランキング: ` : "ランキング: ";
  return preview ? `${prefix}${preview}...` : "ランキングを共有しよう";
}

export default async function ShareRankingPage({ params }: Props) {
  const { id } = await params;
  const ranking = await getCachedPublicRanking(id);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Brand */}
        <h1 className="text-4xl font-bold text-foreground">OKINY</h1>

        {ranking ? (
          <div className="flex flex-col items-center gap-3">
            {/* 著者情報 */}
            <Link
              href={`/users/${ranking.authorId}`}
              className="flex items-center gap-2 transition hover:opacity-80"
            >
              {ranking.authorAvatarUrl ? (
                <Image
                  src={ranking.authorAvatarUrl}
                  alt={ranking.authorName}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {ranking.authorName.charAt(0)}
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                {ranking.authorName}
              </span>
            </Link>
            <h2 className="text-2xl font-semibold text-foreground">
              {ranking.title}
            </h2>
            {ranking.tagName && (
              <span className="rounded-full bg-muted px-4 py-1 text-sm text-muted-foreground">
                {ranking.tagName}
              </span>
            )}
          {/* Ranking Items (TOP 5) */}
            {ranking.items.filter((item) => item.trim() !== "").length > 0 && (
              <div className="mt-3 w-full max-w-sm overflow-hidden rounded-xl bg-card">
                {ranking.items
                  .map((item, index) => ({ text: item, rank: index + 1 }))
                  .filter((entry) => entry.text.trim() !== "")
                  .slice(0, 5)
                  .map((entry, idx, arr) => (
                    <div
                      key={`share-item-${entry.rank}`}
                      className={`flex items-center gap-3 px-6 py-3${idx < arr.length - 1 ? " border-b border-border" : ""}`}
                    >
                      <span
                        className={`w-8 text-center ${entry.rank === 1 ? "text-2xl font-bold text-primary" : "text-base font-semibold text-muted-foreground"}`}
                      >
                        {entry.rank}
                      </span>
                      <span
                        className={
                          entry.rank === 1
                            ? "text-base font-bold text-foreground"
                            : "text-sm text-foreground"
                        }
                      >
                        {entry.text}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-lg text-muted-foreground">
            ランキングを共有しよう
          </p>
        )}

        {/* CTA Button */}
        <Link
          href={`/rankings/${id}`}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-lg font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          OKINYでランキングを見る
        </Link>

        {/* Footer */}
        <p className="mt-8 text-sm text-muted-foreground">okiny.app</p>
      </div>
    </div>
  );
}
