"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useSessionUser } from "@/hooks/use-session-user";
import { trackEvent } from "@/lib/analytics";
import { ENABLE_SNS_EXPANSION } from "@/lib/features";
import type { FeedItem, UserMini } from "@/lib/types";

interface FeedResponse {
  items: FeedItem[];
  nextCursor: string | null;
  discovery: {
    tags: Array<{ id: string; label: string }>;
    users: UserMini[];
  };
}

function FeedPageContent() {
  const searchParams = useSearchParams();
  const { user } = useSessionUser();
  const [isLoading, setIsLoading] = useState(true);
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tab = searchParams.get("tab") === "following" ? "following" : "for-you";

  useEffect(() => {
    if (!ENABLE_SNS_EXPANSION || !user) {
      return;
    }

    let canceled = false;
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      userId: user.id,
      tab,
    });
    void fetch(`/api/v1/feed?${params.toString()}`, { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as { data?: FeedResponse; error?: { message?: string } };
        if (!response.ok || !body.data) {
          throw new Error(body.error?.message ?? "フィードの読み込みに失敗しました。");
        }
        if (canceled) {
          return;
        }
        setFeed(body.data);
        trackEvent("feed_open", {
          user_id: user.id,
          tab,
        });
      })
      .catch((reason: unknown) => {
        if (canceled) {
          return;
        }
        setError(reason instanceof Error ? reason.message : "フィードの読み込みに失敗しました。");
      })
      .finally(() => {
        if (canceled) {
          return;
        }
        setIsLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [tab, user]);

  useEffect(() => {
    if (!user || !ENABLE_SNS_EXPANSION) {
      return;
    }
    const key = `okiny:last_visit:${user.id}`;
    const previous = window.localStorage.getItem(key);
    const now = new Date();
    if (previous) {
      const prev = new Date(previous);
      const diffDays = Math.floor((now.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 1) {
        trackEvent("return_visit_d1", {
          user_id: user.id,
          days_since_last_visit: diffDays,
        });
      }
    }
    window.localStorage.setItem(key, now.toISOString());
  }, [user]);

  const heading = useMemo(() => (tab === "following" ? "フォロー中フィード" : "おすすめフィード"), [tab]);

  if (!ENABLE_SNS_EXPANSION) {
    return (
      <AppShell title="ホームフィード" subtitle="SNS拡張は無効です。">
        <p className="text-sm text-slate-600">
          フィード画面を利用するには `NEXT_PUBLIC_ENABLE_SNS_EXPANSION=true` を有効にしてください。
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={heading}
      subtitle="継続率優先: 投稿→反応→再訪のループを最短導線で回すホーム画面。"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/feed?tab=for-you"
            className={`rounded-md px-3 py-2 text-sm font-semibold ${
              tab === "for-you" ? "bg-blue-700 text-white" : "border border-slate-300 bg-white"
            }`}
          >
            おすすめ
          </Link>
          <Link
            href="/feed?tab=following"
            className={`rounded-md px-3 py-2 text-sm font-semibold ${
              tab === "following" ? "bg-blue-700 text-white" : "border border-slate-300 bg-white"
            }`}
          >
            フォロー中
          </Link>
          <Link href="/composer" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
            投稿作成
          </Link>
          <Link href="/notifications" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
            通知
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <div className="h-20 animate-pulse rounded-md bg-slate-100" />
            <div className="h-20 animate-pulse rounded-md bg-slate-100" />
          </div>
        ) : error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : feed && feed.items.length > 0 ? (
          <div className="space-y-3">
            {feed.items.map((item) => {
              const like = item.reactions.find((reaction) => reaction.type === "like");
              const save = item.reactions.find((reaction) => reaction.type === "save");
              return (
                <article key={item.id} className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-lg font-bold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-600">
                    投稿者:{" "}
                    <Link href={`/profile/${item.author.id}`} className="font-semibold text-blue-700 underline">
                      {item.author.name}
                    </Link>{" "}
                    / タグ: {item.tagId}
                  </p>
                  <ol className="mt-2 space-y-1 text-sm text-slate-700">
                    {item.previewItems.map((preview, index) => (
                      <li key={`${item.id}-${index}`}>{index + 1}. {preview}</li>
                    ))}
                  </ol>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span>いいね {like?.count ?? 0}</span>
                    <span>保存 {save?.count ?? 0}</span>
                    <span>コメント {item.commentsCount}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/feed/${item.rankingId}`}
                      className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      投稿詳細を開く
                    </Link>
                    <Link
                      href={`/profile/${item.author.id}`}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                    >
                      プロフィールを開く
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-700">
              フィードに表示できる投稿がありません。おすすめユーザーをフォローして再読み込みしてください。
            </p>
            <Link href="/profile/user-google-001" className="inline-flex rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white">
              プロフィールを開いてフォローする
            </Link>
          </div>
        )}

        {feed ? (
          <div className="grid gap-3 md:grid-cols-2">
            <section className="rounded-md border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold tracking-wide text-slate-500">発見タグ</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {feed.discovery.tags.map((tag) => (
                  <span key={tag.id} className="rounded-full border border-slate-300 px-2 py-1 text-xs font-semibold">
                    {tag.label}
                  </span>
                ))}
              </div>
            </section>
            <section className="rounded-md border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold tracking-wide text-slate-500">おすすめユーザー</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {feed.discovery.users.length === 0 ? (
                  <span className="text-xs text-slate-500">おすすめユーザーはいません。</span>
                ) : (
                  feed.discovery.users.map((candidate) => (
                    <Link
                      key={candidate.id}
                      href={`/profile/${candidate.id}`}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold"
                    >
                      {candidate.name}
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={null}>
      <FeedPageContent />
    </Suspense>
  );
}
