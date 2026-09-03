'use client';

import type { ManIntakePhotoKind } from '@/lib/manIntakeUploadSession';

const DATABASE = 'iconik-man-intake';
const STORE = 'pending-photos';
const VERSION = 1;
const MAX_AGE_MS = 48 * 60 * 60 * 1_000;

type StoredPhoto = { kind: ManIntakePhotoKind; file: File; storedAt: number };

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB is unavailable'));
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'kind' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open photo recovery storage'));
  });
}

async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore, done: (value: T) => void) => void): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    let result: T;
    action(store, value => { result = value; });
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error('Photo recovery storage failed')); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error('Photo recovery storage was aborted')); };
  });
}

export async function savePendingManIntakePhoto(kind: ManIntakePhotoKind, file: File): Promise<void> {
  await transaction<void>('readwrite', (store, done) => {
    store.put({ kind, file, storedAt: Date.now() } satisfies StoredPhoto);
    done(undefined);
  });
}

export async function loadPendingManIntakePhoto(kind: ManIntakePhotoKind): Promise<File | null> {
  const value = await transaction<StoredPhoto | null>('readonly', (store, done) => {
    const request = store.get(kind);
    request.onsuccess = () => done((request.result as StoredPhoto | undefined) || null);
    request.onerror = () => done(null);
  });
  if (!value) return null;
  if (!(value.file instanceof File) || Date.now() - value.storedAt > MAX_AGE_MS) {
    await deletePendingManIntakePhoto(kind).catch(() => undefined);
    return null;
  }
  return value.file;
}

export async function deletePendingManIntakePhoto(kind: ManIntakePhotoKind): Promise<void> {
  await transaction<void>('readwrite', (store, done) => { store.delete(kind); done(undefined); });
}

export async function clearPendingManIntakePhotos(): Promise<void> {
  await transaction<void>('readwrite', (store, done) => { store.clear(); done(undefined); });
}
