import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAuthenticatedUserId } from "@/lib/supabase/auth-guard";
import { BookmarksContent } from "@/components/bookmarks-content";

export const metadata: Metadata = {
  title: "ブックマーク",
  description: "ブックマークしたランキング一覧",
};

export default async function BookmarksPage() {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    redirect("/login");
  }

  return <BookmarksContent />;
}
