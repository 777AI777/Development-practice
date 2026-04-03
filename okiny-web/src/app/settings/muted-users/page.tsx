import { redirect } from "next/navigation";

import { MutedBlockedListContent } from "@/components/muted-blocked-list-content";
import { getAuthenticatedUserId } from "@/lib/supabase/auth-guard";
import { listBlockedUsers, listMutedUsers, listMutedWords } from "@/lib/supabase-rest";

export default async function MutedUsersPage() {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    redirect("/");
  }

  const [mutedUsers, blockedUsers, mutedWords] = await Promise.all([
    listMutedUsers({ userId: auth.userId }),
    listBlockedUsers({ userId: auth.userId }),
    listMutedWords({ userId: auth.userId, accessToken: auth.accessToken }),
  ]);

  return (
    <MutedBlockedListContent
      mutedUsers={mutedUsers}
      blockedUsers={blockedUsers}
      mutedWords={mutedWords}
      initialTab="muted"
    />
  );
}
