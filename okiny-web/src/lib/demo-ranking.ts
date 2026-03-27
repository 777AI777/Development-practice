import type { PublishedRanking } from "@/lib/types";

export const DEMO_RANKING_ID = "demo";

export const DEMO_RANKING: PublishedRanking = {
  id: DEMO_RANKING_ID,
  userId: "user-google-001",
  title: "Movie Top 5",
  tagId: "movie",
  isPublic: true,
  tagName: "映画",
  items: [
    "Inception",
    "Spirited Away",
    "Parasite",
    "The Dark Knight",
    "Interstellar",
  ],
  createdAt: "2026-02-20T00:00:00.000Z",
  updatedAt: "2026-02-20T00:00:00.000Z",
  viewCount: 0,
  bookmarkCount: 0,
  isBookmarked: false,
};

