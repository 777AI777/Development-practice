import type {
  PublishedCreateInput,
  PublishedRepository,
} from "@/lib/published/published-repository";
import type { PublishedRanking } from "@/lib/types";

class MemoryPublishedRepository implements PublishedRepository {
  private readonly records = new Map<string, PublishedRanking>();

  async listByUser(userId: string): Promise<PublishedRanking[]> {
    return [...this.records.values()]
      .filter((record) => record.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async create(input: PublishedCreateInput): Promise<PublishedRanking> {
    const now = new Date().toISOString();
    const record: PublishedRanking = {
      id: crypto.randomUUID(),
      userId: input.userId,
      title: input.ranking.title.trim(),
      tagId: input.ranking.tagId.trim(),
      items: input.ranking.items.map((item) => item.trim()) as PublishedRanking["items"],
      createdAt: now,
      updatedAt: now,
    };

    this.records.set(record.id, record);
    return record;
  }
}

declare global {
  var __okinyPublishedRepository: MemoryPublishedRepository | undefined;
}

export function getPublishedRepository(): PublishedRepository {
  if (!globalThis.__okinyPublishedRepository) {
    globalThis.__okinyPublishedRepository = new MemoryPublishedRepository();
  }
  return globalThis.__okinyPublishedRepository;
}
