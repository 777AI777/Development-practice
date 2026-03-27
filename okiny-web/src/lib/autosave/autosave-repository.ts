export interface AutosaveRecord {
  key: string;
  userId: string;
  title: string;
  tagId: string;
  items: string[];
  isPublic: boolean;
  newTagName?: string;
  selectedTagName?: string;
  updatedAt: string;
}

export type AutosaveSaveInput = Omit<AutosaveRecord, "key" | "userId" | "updatedAt">;

export interface AutosaveRepository {
  get(userId: string, key: string): Promise<AutosaveRecord | undefined>;
  save(userId: string, key: string, data: AutosaveSaveInput): Promise<void>;
  delete(userId: string, key: string): Promise<void>;
  has(userId: string, key: string): Promise<boolean>;
}
