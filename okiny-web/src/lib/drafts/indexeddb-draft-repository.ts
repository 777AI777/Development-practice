import {
  DRAFT_DB_NAME,
  DRAFT_DB_VERSION,
  DRAFT_STORE_NAME,
  MAX_DRAFTS_PER_USER,
} from "@/lib/drafts/constants";
import { DraftLimitError } from "@/lib/drafts/draft-errors";
import type {
  DraftRepository,
  DraftSaveInput,
} from "@/lib/drafts/draft-repository";
import type { DraftLocalRecord } from "@/lib/types";

let dbPromise: Promise<IDBDatabase> | null = null;

function ensureIndexedDb(): void {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this environment.");
  }
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IDB request failed"));
  });
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IDB transaction failed"));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IDB transaction aborted"));
  });
}

function getDatabase(): Promise<IDBDatabase> {
  ensureIndexedDb();

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DRAFT_DB_NAME, DRAFT_DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(DRAFT_STORE_NAME)) {
        const store = database.createObjectStore(DRAFT_STORE_NAME, {
          keyPath: "draftId",
        });
        store.createIndex("userId", "userId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to open IndexedDB"));
  });

  return dbPromise;
}

function toSorted(records: DraftLocalRecord[]): DraftLocalRecord[] {
  return records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function normalizeInput(input: DraftSaveInput): DraftSaveInput {
  const title = input.title.trim();
  const tagId = input.tagId.trim();
  const items = input.items.map((item) => item.trim()) as DraftSaveInput["items"];
  return { draftId: input.draftId, title, tagId, items };
}

export class IndexedDbDraftRepository implements DraftRepository {
  private async readById(draftId: string): Promise<DraftLocalRecord | undefined> {
    const database = await getDatabase();
    const transaction = database.transaction(DRAFT_STORE_NAME, "readonly");
    const store = transaction.objectStore(DRAFT_STORE_NAME);
    const draft = await requestToPromise(store.get(draftId));
    await transactionToPromise(transaction);
    return draft as DraftLocalRecord | undefined;
  }

  async list(userId: string): Promise<DraftLocalRecord[]> {
    const database = await getDatabase();
    const transaction = database.transaction(DRAFT_STORE_NAME, "readonly");
    const store = transaction.objectStore(DRAFT_STORE_NAME);
    const index = store.index("userId");
    const records = (await requestToPromise(
      index.getAll(IDBKeyRange.only(userId)),
    )) as DraftLocalRecord[];
    await transactionToPromise(transaction);
    return toSorted(records);
  }

  async count(userId: string): Promise<number> {
    const database = await getDatabase();
    const transaction = database.transaction(DRAFT_STORE_NAME, "readonly");
    const store = transaction.objectStore(DRAFT_STORE_NAME);
    const index = store.index("userId");
    const count = await requestToPromise(index.count(IDBKeyRange.only(userId)));
    await transactionToPromise(transaction);
    return count;
  }

  async save(userId: string, draft: DraftSaveInput): Promise<DraftLocalRecord> {
    const normalized = normalizeInput(draft);
    const existing =
      normalized.draftId !== undefined
        ? await this.readById(normalized.draftId)
        : undefined;

    if (existing && existing.userId !== userId) {
      throw new Error("Draft does not belong to the current user.");
    }

    if (!existing) {
      const draftCount = await this.count(userId);
      if (draftCount >= MAX_DRAFTS_PER_USER) {
        throw new DraftLimitError("Draft limit reached (max 5).");
      }
    }

    const database = await getDatabase();
    const transaction = database.transaction(DRAFT_STORE_NAME, "readwrite");
    const store = transaction.objectStore(DRAFT_STORE_NAME);

    const record: DraftLocalRecord = {
      draftId: normalized.draftId ?? crypto.randomUUID(),
      userId,
      title: normalized.title,
      tagId: normalized.tagId,
      items: normalized.items,
      updatedAt: new Date().toISOString(),
    };

    store.put(record);
    await transactionToPromise(transaction);
    return record;
  }

  async delete(userId: string, draftId: string): Promise<void> {
    const existing = await this.readById(draftId);
    if (!existing || existing.userId !== userId) {
      return;
    }

    const database = await getDatabase();
    const transaction = database.transaction(DRAFT_STORE_NAME, "readwrite");
    const store = transaction.objectStore(DRAFT_STORE_NAME);
    store.delete(draftId);
    await transactionToPromise(transaction);
  }
}

export async function __resetDraftDbForTests(): Promise<void> {
  dbPromise = null;
  if (typeof indexedDB === "undefined") {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DRAFT_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to reset draft db"));
    request.onblocked = () => resolve();
  });
}
