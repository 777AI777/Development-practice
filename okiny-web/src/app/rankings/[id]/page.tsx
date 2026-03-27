import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";

import { getAuthenticatedUserId } from "@/lib/supabase/auth-guard";
import { getRankingById, getPublicRankingById, getUserProfile } from "@/lib/supabase-rest";
import { DEMO_RANKING, DEMO_RANKING_ID } from "@/lib/demo-ranking";
import { RankingDetailContent } from "@/components/ranking-detail-content";
import type { UserProfile } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  if (id === DEMO_RANKING_ID) {
    return {
      title: DEMO_RANKING.title,
      description: `${DEMO_RANKING.title}のランキング詳細`,
    };
  }

  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return { title: "ランキング詳細" };
  }

  try {
    // 自分のランキングを優先取得
    const ownRanking = await getRankingById({
      userId: auth.userId,
      rankingId: id,
      accessToken: auth.accessToken,
    });
    if (ownRanking) {
      return {
        title: ownRanking.title,
        description: `${ownRanking.title}のランキング詳細`,
      };
    }

    // 他ユーザーの公開ランキングを取得
    const publicRanking = await getPublicRankingById({
      rankingId: id,
      userId: auth.userId,
      accessToken: auth.accessToken,
    });
    if (publicRanking) {
      return {
        title: publicRanking.title,
        description: `${publicRanking.title}のランキング詳細`,
      };
    }

    return { title: "ランキング詳細" };
  } catch {
    return { title: "ランキング詳細" };
  }
}

export default async function RankingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === DEMO_RANKING_ID) {
    return <RankingDetailContent ranking={DEMO_RANKING} isOwner />;
  }

  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    redirect("/login");
  }

  // 自分のランキングを優先取得
  let ranking;
  let isOwner = false;
  let authorProfile: UserProfile | null = null;

  try {
    ranking = await getRankingById({
      userId: auth.userId,
      rankingId: id,
      accessToken: auth.accessToken,
    });
    if (ranking) {
      isOwner = true;
    }
  } catch {
    // 自分のランキング取得に失敗 — 公開ランキングとして試行
  }

  // 自分のランキングでなければ、公開ランキングとして取得
  if (!ranking) {
    try {
      ranking = await getPublicRankingById({
        rankingId: id,
        userId: auth.userId,
        accessToken: auth.accessToken,
      });
    } catch {
      notFound();
    }
  }

  if (!ranking) {
    notFound();
  }

  // 他ユーザーのランキングの場合、著者プロフィールを取得
  if (!isOwner) {
    authorProfile = await getUserProfile(ranking.userId);
  }

  return (
    <RankingDetailContent
      ranking={ranking}
      isOwner={isOwner}
      authorProfile={authorProfile ?? undefined}
    />
  );
}
