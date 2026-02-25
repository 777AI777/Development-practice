"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useToast } from "@/components/toast-provider";
import { useSessionUser } from "@/hooks/use-session-user";
import { ENABLE_SNS_EXPANSION } from "@/lib/features";
import type { UserProfile } from "@/lib/types";

export default function ProfilePage() {
  const params = useParams<{ userId: string }>();
  const targetUserId = params.userId;
  const { user } = useSessionUser();
  const { pushToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ENABLE_SNS_EXPANSION || !user) {
      return;
    }

    let canceled = false;
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams({ viewerUserId: user.id });
    void fetch(`/api/v1/profiles/${targetUserId}?${params.toString()}`, { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as { data?: UserProfile; error?: { message?: string } };
        if (!response.ok || !body.data) {
          throw new Error(body.error?.message ?? "プロフィールの読み込みに失敗しました。");
        }
        if (canceled) {
          return;
        }
        setProfile(body.data);
      })
      .catch((reason: unknown) => {
        if (canceled) {
          return;
        }
        setError(reason instanceof Error ? reason.message : "プロフィールの読み込みに失敗しました。");
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
  }, [targetUserId, user]);

  const toggleFollow = async () => {
    if (!user || !profile || profile.id === user.id) {
      return;
    }
    const nextFollow = !profile.isFollowing;
    const response = await fetch(`/api/v1/follows/${profile.id}`, {
      method: nextFollow ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followerUserId: user.id }),
    });
    if (!response.ok) {
      pushToast({ type: "error", message: "フォロー状態の更新に失敗しました。" });
      return;
    }
    setProfile((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        isFollowing: nextFollow,
        followersCount: nextFollow ? prev.followersCount + 1 : Math.max(0, prev.followersCount - 1),
      };
    });
    pushToast({ type: "success", message: nextFollow ? "フォローしました。" : "フォローを解除しました。" });
  };

  if (!ENABLE_SNS_EXPANSION) {
    return (
      <AppShell title="プロフィール" subtitle="SNS拡張は無効です。">
        <p className="text-sm text-slate-600">
          プロフィール画面を利用するには `NEXT_PUBLIC_ENABLE_SNS_EXPANSION=true` を有効にしてください。
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="プロフィール"
      subtitle="ユーザープロフィールとフォロー導線。投稿から関係性構築へつなげる画面。"
    >
      {isLoading ? (
        <div className="h-24 animate-pulse rounded-md bg-slate-100" />
      ) : error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : profile ? (
        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xl font-bold text-slate-900">{profile.name}</p>
            <p className="mt-1 text-sm text-slate-600">{profile.bio ?? "自己紹介は未設定です"}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
              <span>フォロワー: {profile.followersCount}</span>
              <span>フォロー中: {profile.followingCount}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.id !== user?.id ? (
              <button
                type="button"
                onClick={() => void toggleFollow()}
                className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
              >
                {profile.isFollowing ? "フォロー解除" : "フォロー"}
              </button>
            ) : null}
            <Link href="/feed?tab=following" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
              フォロー中フィードを開く
            </Link>
            <Link href="/feed" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">
              フィードに戻る
            </Link>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
