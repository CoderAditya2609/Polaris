export type Mood = 'heavy' | 'low' | 'steady' | 'good' | 'radiant';

export interface EntryPayload {
  title: string;
  html: string;
  mood: Mood | null;
}

export interface EntryRecord {
  date: string;
  updatedAt: number;
  iv: Uint8Array<ArrayBuffer>;
  data: ArrayBuffer;
}

export interface PhotoRecord {
  date: string;
  mime: string;
  iv: Uint8Array<ArrayBuffer>;
  data: ArrayBuffer;
}

export interface Settings {
  displayName: string;
  autoLockMinutes: number;
}

export interface KdfMeta {
  salt: Uint8Array<ArrayBuffer>;
  iterations: number;
}

export interface SealedBox {
  iv: Uint8Array<ArrayBuffer>;
  data: ArrayBuffer;
}

export interface Entry extends EntryPayload {
  date: string;
  updatedAt: number;
}

export type ThemeName = 'dark' | 'light';
