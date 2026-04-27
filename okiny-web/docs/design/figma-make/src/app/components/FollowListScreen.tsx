import { useState } from "react";
import { Button } from "./ui/button";
import { AppHeader } from "./AppHeader";
import type { Screen } from "./types";

interface FollowListScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface MockUser {
  id: string;
  displayName: string;
  displayUserId: string;
  initial: string;
  isFollowing: boolean;
}

const MOCK_FOLLOWERS: MockUser[] = [
  { id: "1", displayName: "Alice", displayUserId: "alice_01", initial: "A", isFollowing: true },
  { id: "2", displayName: "Bob", displayUserId: "bob_movie", initial: "B", isFollowing: false },
  { id: "3", displayName: "Charlie", displayUserId: "charlie_music", initial: "C", isFollowing: true },
  { id: "4", displayName: "Diana", displayUserId: "diana_cafe", initial: "D", isFollowing: false },
];

const MOCK_FOLLOWING: MockUser[] = [
  { id: "5", displayName: "Eve", displayUserId: "eve_travel", initial: "E", isFollowing: true },
  { id: "6", displayName: "Frank", displayUserId: "frank_game", initial: "F", isFollowing: true },
  { id: "1", displayName: "Alice", displayUserId: "alice_01", initial: "A", isFollowing: true },
];

function UserAvatar({ initial }: { initial: string }) {
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
      style={{
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
      }}
    >
      {initial}
    </div>
  );
}

function UserListItem({
  user,
  showRemoveButton,
}: {
  user: MockUser;
  showRemoveButton?: boolean;
}) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <UserAvatar initial={user.initial} />

      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-medium"
          style={{ color: "var(--foreground)" }}
        >
          {user.displayName}
        </p>
        <p
          className="truncate text-xs"
          style={{ color: "var(--muted-foreground)" }}
        >
          @{user.displayUserId}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant={isFollowing ? "outline" : "default"}
          size="sm"
          onClick={() => setIsFollowing((prev) => !prev)}
          className="text-xs"
        >
          {isFollowing ? "フォロー中" : "フォロー"}
        </Button>
        {showRemoveButton && (
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-muted"
            style={{ color: "var(--muted-foreground)" }}
            aria-label="フォロワーから削除"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: "followers" | "following" }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        {tab === "followers"
          ? "フォロワーはまだいません"
          : "まだ誰もフォローしていません"}
      </p>
    </div>
  );
}

export function FollowListScreen({ onNavigate }: FollowListScreenProps) {
  const [activeTab, setActiveTab] = useState<"followers" | "following">("following");

  const followerCount = MOCK_FOLLOWERS.length;
  const followingCount = MOCK_FOLLOWING.length;

  const currentList = activeTab === "followers" ? MOCK_FOLLOWERS : MOCK_FOLLOWING;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <AppHeader onNavigate={onNavigate} />

      <div className="max-w-[480px] mx-auto">
        {/* ヘッダー: 戻るボタン + ユーザー名 */}
        <div className="px-4 pt-4 pb-2">
          <button
            type="button"
            onClick={() => onNavigate("user-profile")}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition hover:bg-muted"
            style={{ color: "var(--muted-foreground)" }}
          >
            <span aria-hidden="true">←</span>
            <span>Taro Yamada</span>
          </button>
        </div>

        {/* タブバー */}
        <div
          className="flex"
          style={{ borderBottom: "1px solid var(--border)" }}
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "following"}
            onClick={() => setActiveTab("following")}
            className="flex-1 py-3 text-center text-sm font-semibold transition bg-transparent border-none cursor-pointer"
            style={{
              color: activeTab === "following"
                ? "var(--foreground)"
                : "var(--muted-foreground)",
              borderBottom: activeTab === "following"
                ? "2px solid var(--primary)"
                : "2px solid transparent",
            }}
          >
            {`フォロー中 ${followingCount}`}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "followers"}
            onClick={() => setActiveTab("followers")}
            className="flex-1 py-3 text-center text-sm font-semibold transition bg-transparent border-none cursor-pointer"
            style={{
              color: activeTab === "followers"
                ? "var(--foreground)"
                : "var(--muted-foreground)",
              borderBottom: activeTab === "followers"
                ? "2px solid var(--primary)"
                : "2px solid transparent",
            }}
          >
            {`フォロワー ${followerCount}`}
          </button>
        </div>

        {/* ユーザーリスト */}
        <div role="tabpanel">
          {currentList.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            <div>
              {currentList.map((user) => (
                <UserListItem
                  key={`${activeTab}-${user.id}`}
                  user={user}
                  showRemoveButton={activeTab === "followers"}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
