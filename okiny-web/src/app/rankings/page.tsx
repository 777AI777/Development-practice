import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAuthenticatedUserId } from "@/lib/supabase/auth-guard";
import { getUserProfile } from "@/lib/supabase-rest";
import { RankingsListContent } from "@/components/rankings-list-content";

export const metadata: Metadata = {
  title: "ランキング一覧",
  description: "あなたのランキングを管理しよう",
};

export default async function RankingsPage() {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    redirect("/login");
  }

  const profile = await getUserProfile(auth.userId);

  return (
    <RankingsListContent
      userName={profile?.displayName ?? auth.userName ?? undefined}
      userAvatarUrl={profile?.avatarUrl ?? undefined}
    />
  );
}
