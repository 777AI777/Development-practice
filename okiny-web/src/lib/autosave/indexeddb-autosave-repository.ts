import {
  AUTOSAVE_DB_NAME,
  AUTOSAVE_DB_VERSION,
  AUTOSAVE_STORE_NAME,
} from "@/lib/autosave/constants";
import type {
  AutosaveRecord,
  AutosaveRepository,
  AutosaveSaveInput,
} from "@/lib/autosave/autosave-repository";
import { DRAFT_STORE_NAME } from "@/lib/drafts/constants";

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

function buildId(userId: string, key: string): string {
  return `${userId}:${key}`;
}

function getDatabase(): Promise<IDBDatabase> {
  ensureIndexedDb();

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(AUTOSAVE_DB_NAME, AUTOSAVE_DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(DRAFT_STORE_NAME)) {
        const draftStore = database.createObjectStore(DRAFT_STORE_NAME, {
          keyPath: "draftId",
        });
        draftStore.createIndex("userId", "userId", { unique: false });
      }

      if (!database.objectStoreNames.contains(AUTOSAVE_STORE_NAME)) {
        const store = database.createObjectStore(AUTOSAVE_STORE_NAME, {
          keyPath: "id",
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

export class IndexedDbAutosaveRepository implements AutosaveRepository {
  async get(userId: string, key: string): Promise<AutosaveRecord | undefined> {
    const database = await getDatabase();
    const transaction = database.transaction(AUTOSAVE_STORE_NAME, "readonly");
    const store = transaction.objectStore(AUTOSAVE_STORE_NAME);
    const id = buildId(userId, key);
    const record = await requestToPromise(store.get(id));
    await transactionToPromise(transaction);

    if (!record || (record as AutosaveRecord & { id: string }).userId !== userId) {
      return undefined;
    }

    const { id: _id, ...rest } = record as AutosaveRecord & { id: string };
    return rest as AutosaveRecord;
  }

  async save(userId: string, key: string, data: AutosaveSaveInput): Promise<void> {
    const database = await getDatabase();

    const isDraftKey = key.startsWith("draft:");
    const storeNames: string[] = isDraftKey
      ? [AUTOSAVE_STORE_NAME, DRAFT_STORE_NAME]
      : [AUTOSAVE_STORE_NAME];

    const transaction = database.transaction(storeNames, "readwrite");
    const autosaveStore = transaction.objectStore(AUTOSAVE_STORE_NAME);

    const now = new Date().toISOString();

    const record = {
      id: buildId(userId, key),
      userId,
      key,
      title: data.title,
      tagId: data.tagId,
      items: [...data.items],
      updatedAt: now,
      ...(data.newTagName ? { newTagName: data.newTagName } : {}),
      ...(data.selectedTagName ? { selectedTagName: data.selectedTagName } : {}),
    };

    autosaveStore.put(record);

    if (isDraftKey) {
      const draftId = key.substring("draft:".length);
      const draftStore = transaction.objectStore(DRAFT_STORE_NAME);
      const draftRecord = {
        draftId,
        userId,
        title: data.title,
        tagId: data.tagId,
        items: [...data.items],
        updatedAt: now,
        ...(data.newTagName ? { newTagName: data.newTagName } : {}),
        ...(data.selectedTagName ? { selectedTagName: data.selectedTagName } : {}),
      };
      draftStore.put(draftRecord);
    }

    await transactionToPromise(transaction);
  }

  async delete(userId: string, key: string): Promise<void> {
    const existing = await this.get(userId, key);
    if (!existing) {
      return;
    }

    const database = await getDatabase();
    const transaction = database.transaction(AUTOSAVE_STORE_NAME, "readwrite");
    const store = transaction.objectStore(AUTOSAVE_STORE_NAME);
    store.delete(buildId(userId, key));
    await transactionToPromise(transaction);
  }

  async has(userId: string, key: string): Promise<boolean> {
    const record = await this.get(userId, key);
    return record !== undefined;
  }
}

export async function __resetAutosaveDbForTests(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
  }
  dbPromise = null;

  if (typeof indexedDB === "undefined") {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(AUTOSAVE_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to reset autosave db"));
    request.onblocked = () => resolve();
  });
}
