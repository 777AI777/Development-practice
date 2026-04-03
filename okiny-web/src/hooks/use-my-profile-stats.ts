"use client";

import { useEffect, useRef, useState } from "react";

import type { UserProfileWithCounts } from "@/lib/types";

interface MyProfileStats {
  publicRankingCount: number;
  followingCount: number;
  followerCount: number;
}

interface UseMyProfileStatsResult {
  stats: MyProfileStats | null;
  isLoading: boolean;
}

/**
 * モジュールレベルのキャッシュ。
 * ページ遷移のたびに再フェッチするのを防ぐ。
 */
const statsCache = new Map<string, { data: MyProfileStats; fetchedAt: number }>();
const statsInflight = new Map<string, Promise<MyProfileStats | null>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分

/**
 * ログインユーザーの公開ランキング数・フォロー数・フォロワー数を取得する。
 * /api/v1/users/{userId} エンドポイントを利用。
 * キャッシュが有効な間は再フェッチしない。
 */
export function useMyProfileStats(userId: string | undefined | null): UseMyProfileStatsResult {
  const [stats, setStats] = useState<MyProfileStats | null>(() => {
    if (!userId) return null;
    const cached = statsCache.get(userId);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached.data;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!userId) {
      setStats(null);
      return;
    }

    const cached = statsCache.get(userId);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      setStats(cached.data);
      return;
    }

    let cancelled = false;

    setIsLoading(true);

    // 同時リクエストの重複排除
    if (!statsInflight.has(userId)) {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const promise = fetch(`/api/v1/users/${encodeURIComponent(userId)}`, {
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error(`status ${res.status}`);
          return res.json() as Promise<{
            data: {
              profile: UserProfileWithCounts;
              rankings: unknown[];
            };
          }>;
        })
        .then(({ data }): MyProfileStats => {
          const newStats: MyProfileStats = {
            publicRankingCount: data.profile.publicRankingCount,
            followingCount: data.profile.followingCount,
            followerCount: data.profile.followerCount,
          };
          statsCache.set(userId, { data: newStats, fetchedAt: Date.now() });
          return newStats;
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return null;
          if (process.env.NODE_ENV !== "production") {
            console.warn("[useMyProfileStats] failed:", error);
          }
          return null;
        })
        .finally(() => {
          statsInflight.delete(userId);
        });

      statsInflight.set(userId, promise);
    }

    statsInflight
      .get(userId)!
      .then((result) => {
        if (!cancelled && result) {
          setStats(result);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { stats, isLoading };
}

/**
 * キャッシュを無効化する。
 * フォロー/アンフォロー等、統計値が変化するアクション後に呼び出す。
 */
export function invalidateMyProfileStats(userId?: string) {
  if (userId) {
    statsCache.delete(userId);
  } else {
    statsCache.clear();
  }
}
