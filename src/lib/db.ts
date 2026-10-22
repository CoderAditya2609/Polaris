import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { EntryRecord, KdfMeta, PhotoRecord, SealedBox } from './types';

interface PolarisDB extends DBSchema {
  meta: { key: string; value: unknown };
  entries: { key: string; value: EntryRecord };
  photos: { key: string; value: PhotoRecord };
}

export type Database = IDBPDatabase<PolarisDB>;

let dbPromise: Promise<Database> | null = null;

export function getDB(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = openDB<PolarisDB>('polaris-journal', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
        if (!db.objectStoreNames.contains('entries')) {
          db.createObjectStore('entries', { keyPath: 'date' });
        }
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos', { keyPath: 'date' });
        }
      },
    });
  }
  return dbPromise;
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return (await db.get('meta', key)) as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('meta', value, key);
}

export async function deleteMeta(key: string): Promise<void> {
  const db = await getDB();
  await db.delete('meta', key);
}

export async function getKdf(): Promise<KdfMeta | undefined> {
  return getMeta<KdfMeta>('kdf');
}

export async function getCheck(): Promise<SealedBox | undefined> {
  return getMeta<SealedBox>('check');
}

export async function getSettingsBox(): Promise<SealedBox | undefined> {
  return getMeta<SealedBox>('settings');
}

export async function putEntry(record: EntryRecord): Promise<void> {
  const db = await getDB();
  await db.put('entries', record);
}

export async function getEntry(date: string): Promise<EntryRecord | undefined> {
  const db = await getDB();
  return db.get('entries', date);
}

export async function getAllEntries(): Promise<EntryRecord[]> {
  const db = await getDB();
  return db.getAll('entries');
}

export async function deleteEntry(date: string): Promise<void> {
  const db = await getDB();
  await db.delete('entries', date);
}

export async function putPhoto(record: PhotoRecord): Promise<void> {
  const db = await getDB();
  await db.put('photos', record);
}

export async function getPhoto(date: string): Promise<PhotoRecord | undefined> {
  const db = await getDB();
  return db.get('photos', date);
}

export async function getAllPhotos(): Promise<PhotoRecord[]> {
  const db = await getDB();
  return db.getAll('photos');
}

export async function deletePhoto(date: string): Promise<void> {
  const db = await getDB();
  await db.delete('photos', date);
}

export async function clearJournalData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['entries', 'photos'], 'readwrite');
  await Promise.all([
    tx.objectStore('entries').clear(),
    tx.objectStore('photos').clear(),
    tx.done,
  ]);
}
