import { redirect } from "next/navigation";

import { getAuthenticatedUserId } from "@/lib/supabase/auth-guard";
import { listRankingsByUser } from "@/lib/supabase-rest";
import { RankingsListContent } from "@/components/rankings-list-content";
import type { PublishedRanking } from "@/lib/types";

export default async function RankingsPage() {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    redirect("/login");
  }

  let rankings: PublishedRanking[];
  try {
    rankings = await listRankingsByUser({
      userId: auth.userId,
      accessToken: auth.accessToken,
    });
  } catch {
    rankings = [];
  }

  return (
    <RankingsListContent
      initialRankings={rankings}
      userName={auth.userName ?? undefined}
    />
  );
}
