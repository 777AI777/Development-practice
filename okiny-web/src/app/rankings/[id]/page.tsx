import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";

import { getAuthenticatedUserId } from "@/lib/supabase/auth-guard";
import { getRankingById } from "@/lib/supabase-rest";
import { DEMO_RANKING, DEMO_RANKING_ID } from "@/lib/demo-ranking";
import { RankingDetailContent } from "@/components/ranking-detail-content";

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
    const ranking = await getRankingById({
      userId: auth.userId,
      rankingId: id,
      accessToken: auth.accessToken,
    });
    if (!ranking) {
      return { title: "ランキング詳細" };
    }
    return {
      title: ranking.title,
      description: `${ranking.title}のランキング詳細`,
    };
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
    return <RankingDetailContent ranking={DEMO_RANKING} />;
  }

  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    redirect("/login");
  }

  let ranking;
  try {
    ranking = await getRankingById({
      userId: auth.userId,
      rankingId: id,
      accessToken: auth.accessToken,
    });
  } catch {
    notFound();
  }

  if (!ranking) {
    notFound();
  }

  return <RankingDetailContent ranking={ranking} />;
}
