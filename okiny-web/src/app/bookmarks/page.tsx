import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAuthenticatedUserId } from "@/lib/supabase/auth-guard";
import { listBookmarkedRankings } from "@/lib/supabase-rest";
import { BookmarksContent } from "@/components/bookmarks-content";
import type { PublishedRanking } from "@/lib/types";

export const metadata: Metadata = {
  title: "ブックマーク",
  description: "ブックマークしたランキング一覧",
};

export default async function BookmarksPage() {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    redirect("/login");
  }

  let rankings: PublishedRanking[];
  try {
    rankings = await listBookmarkedRankings({
      userId: auth.userId,
      accessToken: auth.accessToken,
    });
  } catch {
    rankings = [];
  }

  return (
    <BookmarksContent
      initialRankings={rankings}
    />
  );
}
