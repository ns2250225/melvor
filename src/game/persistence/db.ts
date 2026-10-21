// IndexedDB 持久化接口：所有存档写入都经过此模块
const DB_NAME = 'idle-realms';
const DB_VERSION = 1;

export interface SaveRecord {
  slot: string;
  data: string;          // 序列化存档（JSON）
  prev: string | null;   // 上一次成功保存的存档（异常恢复）
  savedAt: number;
  settlementId: number;
  name: string;
  mode: string;
  totalLevel: number;
}
export interface BackupRecord { id?: number; slot: string; createdAt: number; label: string; data: string }
export interface EventRecord { id?: number; slot: string; t: number; kind: string; payload: any }

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('当前浏览器不支持 IndexedDB')); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('saves')) db.createObjectStore('saves', { keyPath: 'slot' });
      if (!db.objectStoreNames.contains('backups')) {
        const b = db.createObjectStore('backups', { keyPath: 'id', autoIncrement: true });
        b.createIndex('slot', 'slot');
      }
      if (!db.objectStoreNames.contains('events')) {
        const e = db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
        e.createIndex('slot', 'slot');
      }
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('数据库被其他标签页占用'));
  });
  return dbPromise;
}

function tx<T>(stores: string[], mode: IDBTransactionMode, fn: (t: IDBTransaction) => Promise<T> | T): Promise<T> {
  return openDb().then((db) => new Promise<T>((resolve, reject) => {
    const t = db.transaction(stores, mode);
    let result: T;
    Promise.resolve(fn(t)).then((r) => { result = r; }).catch((e) => { try { t.abort(); } catch { /* ignore */ } reject(e); });
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error ?? new Error('事务已中止'));
  }));
}

const reqP = <T>(r: IDBRequest<T>) => new Promise<T>((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

export async function listSaves(): Promise<SaveRecord[]> {
  return tx(['saves'], 'readonly', (t) => reqP(t.objectStore('saves').getAll() as IDBRequest<SaveRecord[]>));
}
export async function getSave(slot: string): Promise<SaveRecord | undefined> {
  return tx(['saves'], 'readonly', (t) => reqP(t.objectStore('saves').get(slot) as IDBRequest<SaveRecord | undefined>));
}

export class SaveConflictError extends Error {}

/**
 * 原子性写入存档。expectedSettlement 用于防止重复结算：
 * 若库中存档的 settlementId 大于期望值，说明已被其他实例结算，拒绝写入。
 */
export async function putSave(rec: Omit<SaveRecord, 'prev'>, expectedSettlement?: number): Promise<void> {
  await tx(['saves'], 'readwrite', async (t) => {
    const store = t.objectStore('saves');
    const existing = (await reqP(store.get(rec.slot))) as SaveRecord | undefined;
    if (existing && expectedSettlement !== undefined && existing.settlementId > expectedSettlement) {
      throw new SaveConflictError('存档已在其他标签页或实例中更新，已阻止重复结算');
    }
    store.put({ ...rec, prev: existing?.data ?? null });
  });
}

export async function deleteSave(slot: string): Promise<void> {
  await tx(['saves', 'backups', 'events'], 'readwrite', async (t) => {
    t.objectStore('saves').delete(slot);
    for (const name of ['backups', 'events']) {
      const idx = t.objectStore(name).index('slot');
      const keys = (await reqP(idx.getAllKeys(slot))) as IDBValidKey[];
      for (const k of keys) t.objectStore(name).delete(k);
    }
  });
}

export async function addBackup(b: BackupRecord): Promise<void> {
  await tx(['backups'], 'readwrite', async (t) => {
    const store = t.objectStore('backups');
    store.add(b);
    // 每个存档位最多保留 20 个备份
    const keys = (await reqP(store.index('slot').getAllKeys(b.slot))) as number[];
    if (keys.length > 20) for (const k of keys.sort((x, y) => x - y).slice(0, keys.length - 20)) store.delete(k);
  });
}
export async function listBackups(slot: string): Promise<BackupRecord[]> {
  return tx(['backups'], 'readonly', (t) => reqP(t.objectStore('backups').index('slot').getAll(slot) as IDBRequest<BackupRecord[]>)).then((l) => l.sort((a, b) => b.createdAt - a.createdAt));
}
export async function deleteBackup(id: number): Promise<void> {
  await tx(['backups'], 'readwrite', (t) => { t.objectStore('backups').delete(id); });
}

export async function addEvent(e: EventRecord): Promise<void> {
  await tx(['events'], 'readwrite', async (t) => {
    const store = t.objectStore('events');
    store.add(e);
    const keys = (await reqP(store.index('slot').getAllKeys(e.slot))) as number[];
    if (keys.length > 50) for (const k of keys.sort((x, y) => x - y).slice(0, keys.length - 50)) store.delete(k);
  });
}
export async function listEvents(slot: string): Promise<EventRecord[]> {
  return tx(['events'], 'readonly', (t) => reqP(t.objectStore('events').index('slot').getAll(slot) as IDBRequest<EventRecord[]>)).then((l) => l.sort((a, b) => b.t - a.t));
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return tx(['meta'], 'readonly', (t) => reqP(t.objectStore('meta').get(key) as IDBRequest<T | undefined>));
}
export async function setMeta(key: string, value: unknown): Promise<void> {
  await tx(['meta'], 'readwrite', (t) => { t.objectStore('meta').put(value, key); });
}
