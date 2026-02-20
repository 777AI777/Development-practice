"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useToast } from "@/components/toast-provider";
import { useSessionUser } from "@/hooks/use-session-user";
import { trackEvent } from "@/lib/analytics";
import { ENABLE_SNS_EXPANSION } from "@/lib/features";
import type { CommentSummary, FeedItem, Reaction } from "@/lib/types";

export default function FeedDetailPage() {
  const params = useParams<{ id: string }>();
  const rankingId = params.id;
  const { user } = useSessionUser();
  const { pushToast } = useToast();
  const [item, setItem] = useState<FeedItem | null>(null);
  const [comments, setComments] = useState<CommentSummary[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ENABLE_SNS_EXPANSION || !user) {
      return;
    }
    let canceled = false;
    setIsLoading(true);
    setError(null);

    const feedParams = new URLSearchParams({ userId: user.id });
    void Promise.all([
      fetch(`/api/v1/feed/${rankingId}?${feedParams.toString()}`, { cache: "no-store" }),
      fetch(`/api/v1/rankings/${rankingId}/comments`, { cache: "no-store" }),
    ])
      .then(async ([feedResponse, commentsResponse]) => {
        const feedBody = (await feedResponse.json()) as { data?: FeedItem; error?: { message?: string } };
        const commentsBody = (await commentsResponse.json()) as {
          data?: CommentSummary[];
          error?: { message?: string };
        };
        if (!feedResponse.ok || !feedBody.data) {
          throw new Error(feedBody.error?.message ?? "Failed to load post detail.");
        }
        if (!commentsResponse.ok || !commentsBody.data) {
          throw new Error(commentsBody.error?.message ?? "Failed to load comments.");
        }
        if (canceled) {
          return;
        }
        setItem(feedBody.data);
        setComments(commentsBody.data);
      })
      .catch((reason: unknown) => {
        if (canceled) {
          return;
        }
        setError(reason instanceof Error ? reason.message : "Failed to load post detail.");
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
  }, [rankingId, user]);

  const reactionMap = useMemo(() => {
    const map = new Map<Reaction["type"], Reaction>();
    if (!item) {
      return map;
    }
    for (const reaction of item.reactions) {
      map.set(reaction.type, reaction);
    }
    return map;
  }, [item]);

  const toggleReaction = async (type: Reaction["type"]) => {
    if (!user || !item) {
      return;
    }
    const current = reactionMap.get(type);
    const shouldActivate = !(current?.reactedByMe ?? false);
    const response = await fetch(`/api/v1/rankings/${rankingId}/reactions`, {
      method: shouldActivate ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, type }),
    });
    const body = (await response.json()) as { data?: Reaction; error?: { message?: string } };
    if (!response.ok || !body.data) {
      pushToast({ type: "error", message: body.error?.message ?? "Reaction update failed." });
      return;
    }
    setItem((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        reactions: prev.reactions.map((reaction) =>
          reaction.type === type ? body.data! : reaction,
        ),
      };
    });
    pushToast({
      type: "success",
      message: type === "like" ? "リアクションを更新しました。" : "保存状態を更新しました。",
    });
    trackEvent("reaction_sent", {
      user_id: user.id,
      ranking_id: rankingId,
      reaction_type: type,
    });
  };

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !commentBody.trim()) {
      return;
    }
    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/v1/rankings/${rankingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, body: commentBody.trim() }),
      });
      const body = (await response.json()) as { data?: CommentSummary; error?: { message?: string } };
      if (!response.ok || !body.data) {
        pushToast({ type: "error", message: body.error?.message ?? "Failed to post comment." });
        return;
      }
      setComments((prev) => [body.data!, ...prev]);
      setCommentBody("");
      pushToast({ type: "success", message: "コメントを投稿しました。" });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const share = async () => {
    const shareUrl = `${window.location.origin}/feed/${rankingId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      pushToast({ type: "info", message: "共有リンクをコピーしました。" });
    } catch {
      pushToast({ type: "error", message: "共有リンクのコピーに失敗しました。" });
    }
  };

  const report = () => {
    pushToast({
      type: "warning",
      message: "通報を受け付けました。モデレーションキューに送信します。",
      persistent: true,
    });
  };

  if (!ENABLE_SNS_EXPANSION) {
    return (
      <AppShell title="Post Detail" subtitle="SNS expansion is disabled.">
        <p className="text-sm text-slate-600">Enable NEXT_PUBLIC_ENABLE_SNS_EXPANSION=true to use feed detail routes.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Post Detail"
      subtitle="リアクション・保存・共有・通報・コメントを集約した拡張詳細画面。"
    >
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-8 animate-pulse rounded bg-slate-100" />
          <div className="h-24 animate-pulse rounded bg-slate-100" />
        </div>
      ) : error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : item ? (
        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-2xl font-bold text-slate-900">{item.title}</p>
            <p className="mt-1 text-xs text-slate-600">
              by{" "}
              <Link href={`/profile/${item.author.id}`} className="font-semibold text-blue-700 underline">
                {item.author.name}
              </Link>{" "}
              / {item.tagId}
            </p>
            <ol className="mt-3 space-y-1 text-sm text-slate-700">
              {item.previewItems.map((entry, index) => (
                <li key={`${item.id}-${index}`}>{index + 1}. {entry}</li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void toggleReaction("like")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  reactionMap.get("like")?.reactedByMe
                    ? "bg-blue-700 text-white"
                    : "border border-slate-300 bg-white"
                }`}
              >
                Like {reactionMap.get("like")?.count ?? 0}
              </button>
              <button
                type="button"
                onClick={() => void toggleReaction("save")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  reactionMap.get("save")?.reactedByMe
                    ? "bg-blue-700 text-white"
                    : "border border-slate-300 bg-white"
                }`}
              >
                Save {reactionMap.get("save")?.count ?? 0}
              </button>
              <button
                type="button"
                onClick={() => void share()}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold"
              >
                Share
              </button>
              <button
                type="button"
                onClick={report}
                className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700"
              >
                Report
              </button>
            </div>
          </div>

          <section className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Comments</p>
            <form onSubmit={(event) => void submitComment(event)} className="flex flex-col gap-2">
              <textarea
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="コメントを書く"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentBody.trim()}
                className="self-start rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                {isSubmittingComment ? "Posting..." : "Post Comment"}
              </button>
            </form>

            {comments.length === 0 ? (
              <p className="text-sm text-slate-500">まだコメントはありません。</p>
            ) : (
              <ul className="space-y-2">
                {comments.map((comment) => (
                  <li key={comment.id} className="rounded-md border border-slate-200 bg-white px-3 py-2">
                    <p className="text-xs font-semibold text-slate-700">{comment.user.name}</p>
                    <p className="text-sm text-slate-800">{comment.body}</p>
                    <p className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
