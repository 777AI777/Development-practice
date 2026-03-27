import type { DraftLocalRecord, RankingItems } from "@/lib/types";

export interface DraftSaveInput {
  draftId?: string;
  title: string;
  tagId: string;
  items: RankingItems;
  isPublic: boolean;
  newTagName?: string;
  selectedTagName?: string;
}

export interface DraftRepository {
  list(userId: string): Promise<DraftLocalRecord[]>;
  save(userId: string, draft: DraftSaveInput): Promise<DraftLocalRecord>;
  delete(userId: string, draftId: string): Promise<void>;
  count(userId: string): Promise<number>;
}

