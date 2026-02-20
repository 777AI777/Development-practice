import type { PublishedRanking, RankingInput } from "@/lib/types";

export interface PublishedCreateInput {
  userId: string;
  ranking: RankingInput;
}

export interface PublishedRepository {
  listByUser(userId: string): Promise<PublishedRanking[]>;
  create(input: PublishedCreateInput): Promise<PublishedRanking>;
}

