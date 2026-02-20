import { MOCK_USERS } from "@/lib/mock-users";
import type {
  CommentSummary,
  FeedItem,
  Reaction,
  UserMini,
  UserProfile,
  Visibility,
} from "@/lib/types";

interface ReactionSets {
  like: Set<string>;
  save: Set<string>;
}

interface SocialStore {
  follows: Map<string, Set<string>>;
  reactions: Map<string, ReactionSets>;
  comments: Map<string, CommentSummary[]>;
  feedItems: FeedItem[];
}

const ALL_USERS: UserMini[] = MOCK_USERS.map((user) => ({
  id: user.id,
  name: user.name,
}));

const now = new Date();

const initialFeed: FeedItem[] = [
  {
    id: "feed-item-001",
    rankingId: "demo",
    title: "映画トップ5",
    tagId: "movie",
    previewItems: ["インセプション", "千と千尋の神隠し", "パラサイト"],
    author: ALL_USERS[0]!,
    visibility: "public",
    createdAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
    reactions: [
      { type: "like", count: 0, reactedByMe: false },
      { type: "save", count: 0, reactedByMe: false },
    ],
    commentsCount: 0,
  },
  {
    id: "feed-item-002",
    rankingId: "music-demo-001",
    title: "朝活プレイリストトップ5",
    tagId: "music",
    previewItems: ["Walking on Sunshine", "新宝島", "花束"],
    author: ALL_USERS[1]!,
    visibility: "public",
    createdAt: new Date(now.getTime() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 45).toISOString(),
    reactions: [
      { type: "like", count: 0, reactedByMe: false },
      { type: "save", count: 0, reactedByMe: false },
    ],
    commentsCount: 0,
  },
  {
    id: "feed-item-003",
    rankingId: "cafe-demo-001",
    title: "週末カフェ巡りトップ5",
    tagId: "cafe",
    previewItems: ["Blue Bottle Coffee", "猿田彦珈琲", "ONIBUS COFFEE"],
    author: ALL_USERS[0]!,
    visibility: "followers",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
    reactions: [
      { type: "like", count: 0, reactedByMe: false },
      { type: "save", count: 0, reactedByMe: false },
    ],
    commentsCount: 0,
  },
];

const store: SocialStore = {
  follows: new Map<string, Set<string>>(),
  reactions: new Map<string, ReactionSets>(),
  comments: new Map<string, CommentSummary[]>(),
  feedItems: initialFeed,
};

function ensureReactionSets(rankingId: string): ReactionSets {
  const current = store.reactions.get(rankingId);
  if (current) {
    return current;
  }
  const next: ReactionSets = { like: new Set<string>(), save: new Set<string>() };
  store.reactions.set(rankingId, next);
  return next;
}

function ensureCommentList(rankingId: string): CommentSummary[] {
  const current = store.comments.get(rankingId);
  if (current) {
    return current;
  }
  const next: CommentSummary[] = [];
  store.comments.set(rankingId, next);
  return next;
}

function resolveFeedReactions(rankingId: string, userId: string): Reaction[] {
  const sets = ensureReactionSets(rankingId);
  return [
    {
      type: "like",
      count: sets.like.size,
      reactedByMe: sets.like.has(userId),
    },
    {
      type: "save",
      count: sets.save.size,
      reactedByMe: sets.save.has(userId),
    },
  ];
}

export function listFeed(input: {
  userId: string;
  tab: "for-you" | "following";
  cursor?: string;
}) {
  const following = store.follows.get(input.userId) ?? new Set<string>();
  const offset = Number(input.cursor ?? "0");
  const filtered =
    input.tab === "following"
      ? store.feedItems.filter((item) => following.has(item.author.id))
      : store.feedItems;

  const sorted = [...filtered].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const page = sorted.slice(offset, offset + 10);
  const nextCursor = offset + 10 < sorted.length ? String(offset + 10) : null;

  return {
    items: page.map((item) => ({
      ...item,
      reactions: resolveFeedReactions(item.rankingId, input.userId),
      commentsCount: ensureCommentList(item.rankingId).length,
    })),
    nextCursor,
  };
}

export function getFeedItemByRankingId(rankingId: string, userId: string): FeedItem | null {
  const target = store.feedItems.find((item) => item.rankingId === rankingId);
  if (!target) {
    return null;
  }
  return {
    ...target,
    reactions: resolveFeedReactions(rankingId, userId),
    commentsCount: ensureCommentList(rankingId).length,
  };
}

export function getUserProfile(input: { viewerUserId: string; userId: string }): UserProfile | null {
  const user = ALL_USERS.find((candidate) => candidate.id === input.userId);
  if (!user) {
    return null;
  }
  const followersCount = Array.from(store.follows.values()).filter((set) => set.has(input.userId)).length;
  const followingCount = store.follows.get(input.userId)?.size ?? 0;
  return {
    ...user,
    bio: "好きなものをランキングで整理中。",
    followersCount,
    followingCount,
    isFollowing: store.follows.get(input.viewerUserId)?.has(input.userId) ?? false,
  };
}

export function followUser(input: { followerUserId: string; targetUserId: string }): void {
  const set = store.follows.get(input.followerUserId) ?? new Set<string>();
  set.add(input.targetUserId);
  store.follows.set(input.followerUserId, set);
}

export function unfollowUser(input: { followerUserId: string; targetUserId: string }): void {
  const set = store.follows.get(input.followerUserId);
  if (!set) {
    return;
  }
  set.delete(input.targetUserId);
}

export function setReaction(input: {
  userId: string;
  rankingId: string;
  type: "like" | "save";
  active: boolean;
}): Reaction {
  const sets = ensureReactionSets(input.rankingId);
  if (input.active) {
    sets[input.type].add(input.userId);
  } else {
    sets[input.type].delete(input.userId);
  }
  return {
    type: input.type,
    count: sets[input.type].size,
    reactedByMe: sets[input.type].has(input.userId),
  };
}

export function listComments(rankingId: string): CommentSummary[] {
  return [...ensureCommentList(rankingId)].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

export function addComment(input: {
  rankingId: string;
  userId: string;
  body: string;
}): CommentSummary {
  const user = ALL_USERS.find((candidate) => candidate.id === input.userId);
  const author: UserMini = user ?? { id: input.userId, name: "Unknown User" };
  const comment: CommentSummary = {
    id: createId("comment"),
    user: author,
    body: input.body,
    createdAt: new Date().toISOString(),
  };
  const list = ensureCommentList(input.rankingId);
  list.push(comment);
  return comment;
}

export function listDiscoveryTags() {
  return [
    { id: "movie", label: "映画" },
    { id: "music", label: "音楽" },
    { id: "cafe", label: "カフェ" },
    { id: "travel", label: "旅行" },
  ];
}

export function listRecommendedUsers(viewerUserId: string): UserMini[] {
  const followed = store.follows.get(viewerUserId) ?? new Set<string>();
  return ALL_USERS.filter((user) => user.id !== viewerUserId && !followed.has(user.id));
}

export const socialVisibilityOptions: Visibility[] = ["private", "followers", "public"];
