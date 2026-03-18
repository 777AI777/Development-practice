import { redirect, notFound } from "next/navigation";

import { getAuthenticatedUserId } from "@/lib/supabase/auth-guard";
import { getRankingById } from "@/lib/supabase-rest";
import { DEMO_RANKING, DEMO_RANKING_ID } from "@/lib/demo-ranking";
import { RankingDetailContent } from "@/components/ranking-detail-content";

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
