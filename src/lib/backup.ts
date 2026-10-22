import {
  clearJournalData,
  getAllEntries,
  getAllPhotos,
  getCheck,
  getKdf,
  getSettingsBox,
  putEntry,
  putPhoto,
  setMeta,
} from './db';
import {
  CHECK_VALUE,
  decryptJSON,
  deriveKey,
  fromB64,
  toB64,
} from './crypto';
import { isDateKey, todayKey } from './date';
import type { KdfMeta, SealedBox } from './types';

export const BACKUP_VERSION = 1;
export const BACKUP_APP = 'polaris';

interface EncodedBox {
  iv: string;
  data: string;
}

interface BackupEntry extends EncodedBox {
  date: string;
  updatedAt: number;
}

interface BackupPhoto extends EncodedBox {
  date: string;
  mime: string;
}

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  iterations: number;
  salt: string;
  check: EncodedBox;
  settings: EncodedBox;
  entries: BackupEntry[];
  photos: BackupPhoto[];
}

function encodeBox(box: SealedBox): EncodedBox {
  return { iv: toB64(box.iv), data: toB64(box.data) };
}

function decodeBox(box: unknown): SealedBox {
  if (!box || typeof box !== 'object') throw new Error('Backup is missing encrypted data.');
  const record = box as Record<string, unknown>;
  if (typeof record.iv !== 'string' || typeof record.data !== 'string') {
    throw new Error('Backup contains malformed encrypted data.');
  }
  const data = fromB64(record.data);
  return { iv: fromB64(record.iv), data: data.buffer };
}

export async function buildBackup(): Promise<BackupFile> {
  const [kdf, check, settings, entries, photos] = await Promise.all([
    getKdf(),
    getCheck(),
    getSettingsBox(),
    getAllEntries(),
    getAllPhotos(),
  ]);

  if (!kdf || !check || !settings) {
    throw new Error('There is nothing to export yet.');
  }

  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    iterations: kdf.iterations,
    salt: toB64(kdf.salt),
    check: encodeBox(check),
    settings: encodeBox(settings),
    entries: entries.map((entry) => ({
      date: entry.date,
      updatedAt: entry.updatedAt,
      iv: toB64(entry.iv),
      data: toB64(entry.data),
    })),
    photos: photos.map((photo) => ({
      date: photo.date,
      mime: photo.mime,
      iv: toB64(photo.iv),
      data: toB64(photo.data),
    })),
  };
}

export function downloadBackup(backup: BackupFile): void {
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Polaris-backup-${todayKey()}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function validateBackup(raw: unknown): BackupFile {
  if (!raw || typeof raw !== 'object') throw new Error('That file is not a Polaris backup.');
  const data = raw as Record<string, unknown>;
  if (data.app !== BACKUP_APP) throw new Error('That file is not a Polaris backup.');
  if (data.version !== BACKUP_VERSION) {
    throw new Error('That backup was made with an unsupported version of Polaris.');
  }
  if (
    typeof data.salt !== 'string' ||
    typeof data.iterations !== 'number' ||
    !Number.isFinite(data.iterations) ||
    data.iterations < 10_000 ||
    data.iterations > 2_000_000
  ) {
    throw new Error('That backup is missing valid encryption details.');
  }
  if (!Array.isArray(data.entries) || !Array.isArray(data.photos)) {
    throw new Error('That backup is incomplete.');
  }
  return data as unknown as BackupFile;
}

export async function restoreBackup(file: File, passphrase: string): Promise<void> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  const backup = validateBackup(parsed);

  let salt: Uint8Array<ArrayBuffer>;
  let checkBox: SealedBox;
  let settingsBox: SealedBox;
  const entries: Array<{
    date: string;
    updatedAt: number;
    iv: Uint8Array<ArrayBuffer>;
    data: ArrayBuffer;
  }> = [];
  const photos: Array<{
    date: string;
    mime: string;
    iv: Uint8Array<ArrayBuffer>;
    data: ArrayBuffer;
  }> = [];

  try {
    salt = fromB64(backup.salt);
    if (salt.length !== 16) throw new Error('bad salt');
    checkBox = decodeBox(backup.check);
    settingsBox = decodeBox(backup.settings);

    for (const entry of backup.entries) {
      if (typeof entry.date !== 'string' || !isDateKey(entry.date)) continue;
      const box = decodeBox(entry);
      entries.push({
        date: entry.date,
        updatedAt: typeof entry.updatedAt === 'number' ? entry.updatedAt : Date.now(),
        iv: box.iv,
        data: box.data,
      });
    }

    for (const photo of backup.photos) {
      if (typeof photo.date !== 'string' || !isDateKey(photo.date)) continue;
      const box = decodeBox(photo);
      photos.push({
        date: photo.date,
        mime: typeof photo.mime === 'string' ? photo.mime : 'image/webp',
        iv: box.iv,
        data: box.data,
      });
    }
  } catch {
    throw new Error('That backup file is damaged and cannot be restored.');
  }

  const key = await deriveKey(passphrase, salt, backup.iterations);

  let verified: { value?: string };
  try {
    verified = await decryptJSON<{ value?: string }>(key, checkBox.iv, checkBox.data);
  } catch {
    throw new Error('That passphrase does not unlock this backup.');
  }
  if (verified.value !== CHECK_VALUE) {
    throw new Error('That passphrase does not unlock this backup.');
  }

  const kdf: KdfMeta = { salt, iterations: backup.iterations };

  await clearJournalData();
  await setMeta('kdf', kdf);
  await setMeta('check', checkBox);
  await setMeta('settings', settingsBox);

  for (const entry of entries) {
    await putEntry(entry);
  }

  for (const photo of photos) {
    await putPhoto(photo);
  }
}
