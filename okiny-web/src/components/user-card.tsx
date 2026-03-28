import Image from "next/image";
import Link from "next/link";

import type { UserSearchResult } from "@/lib/types";
import { getUserInitial } from "@/lib/user-utils";

interface UserCardProps {
  user: UserSearchResult;
  showBorder?: boolean;
}

export function UserCard({ user, showBorder = true }: UserCardProps) {
  const initial = getUserInitial(user.displayName, "?");
  const profilePath = user.displayUserId
    ? `/users/${user.displayUserId}`
    : `/users/${user.id}`;

  return (
    <Link
      href={profilePath}
      className={`flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50${
        showBorder ? " border-b border-border" : ""
      }`}
    >
      {/* アバター */}
      {user.avatarUrl ? (
        <Image
          src={user.avatarUrl}
          alt={user.displayName}
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {initial}
        </div>
      )}

      {/* ユーザー情報 */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {user.displayName}
        </p>
        {user.displayUserId && (
          <p className="truncate text-xs text-muted-foreground">
            @{user.displayUserId}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          公開ランキング {user.publicRankingCount}件
        </p>
      </div>
    </Link>
  );
}
