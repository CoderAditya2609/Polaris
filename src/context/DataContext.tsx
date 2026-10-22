import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  deletePhoto,
  getAllEntries,
  getAllPhotos,
  getPhoto,
  putEntry,
  putPhoto,
} from '../lib/db';
import {
  decryptBytes,
  decryptJSON,
  encryptBytes,
  encryptJSON,
} from '../lib/crypto';
import { sanitizeHtml } from '../lib/html';
import { processPhotoInput } from '../lib/photo';
import type { Entry, EntryPayload } from '../lib/types';

type EntriesMap = Record<string, Entry>;

interface DataValue {
  entries: EntriesMap;
  entryDates: string[];
  photoDates: string[];
  loading: boolean;
  getPhotoUrl: (date: string) => Promise<string | null>;
  saveEntry: (date: string, payload: EntryPayload) => Promise<void>;
  savePhoto: (date: string, file: Blob) => Promise<void>;
  removePhoto: (date: string) => Promise<void>;
}

const DataContext = createContext<DataValue | null>(null);

const photoUrls = new Map<string, string>();
const pendingPhotos = new Map<string, Promise<string | null>>();

function clearPhotoCache(): void {
  for (const url of photoUrls.values()) URL.revokeObjectURL(url);
  photoUrls.clear();
  pendingPhotos.clear();
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { key } = useAuth();
  const [entries, setEntries] = useState<EntriesMap>({});
  const [photoDates, setPhotoDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!key) {
      setEntries({});
      setPhotoDates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    void (async () => {
      try {
        const [records, photos] = await Promise.all([getAllEntries(), getAllPhotos()]);
        const map: EntriesMap = {};
        for (const record of records) {
          try {
            const payload = await decryptJSON<EntryPayload>(key, record.iv, record.data);
            map[record.date] = {
              date: record.date,
              updatedAt: record.updatedAt,
              title: typeof payload.title === 'string' ? payload.title : '',
              html: typeof payload.html === 'string' ? payload.html : '',
              mood: payload.mood ?? null,
            };
          } catch {
            /* A record that cannot be decrypted is skipped rather than breaking the app. */
          }
        }
        if (cancelled) return;
        setEntries(map);
        setPhotoDates(photos.map((photo) => photo.date));
        setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    return () => {
      clearPhotoCache();
    };
  }, []);

  const getPhotoUrl = useCallback(
    async (date: string): Promise<string | null> => {
      if (!key) return null;
      const cached = photoUrls.get(date);
      if (cached) return cached;
      const pending = pendingPhotos.get(date);
      if (pending) return pending;

      const task = (async () => {
        try {
          const record = await getPhoto(date);
          if (!record) return null;
          const bytes = await decryptBytes(key, record.iv, record.data);
          const blob = new Blob([bytes], { type: record.mime });
          const url = URL.createObjectURL(blob);
          photoUrls.set(date, url);
          return url;
        } catch {
          return null;
        } finally {
          pendingPhotos.delete(date);
        }
      })();

      pendingPhotos.set(date, task);
      return task;
    },
    [key],
  );

  const saveEntry = useCallback(
    async (date: string, payload: EntryPayload) => {
      if (!key) throw new Error('Your journal is locked.');
      const clean: EntryPayload = {
        title: payload.title.trim(),
        html: sanitizeHtml(payload.html),
        mood: payload.mood,
      };
      const box = await encryptJSON(key, clean);
      const updatedAt = Date.now();
      await putEntry({ date, updatedAt, iv: box.iv, data: box.data });
      setEntries((current) => ({
        ...current,
        [date]: { date, updatedAt, ...clean },
      }));
    },
    [key],
  );

  const savePhoto = useCallback(
    async (date: string, file: Blob) => {
      if (!key) throw new Error('Your journal is locked.');
      const processed = await processPhotoInput(file);
      const raw = await processed.blob.arrayBuffer();
      const box = await encryptBytes(key, raw);
      await putPhoto({
        date,
        mime: processed.mime,
        iv: box.iv,
        data: box.data,
      });

      const previous = photoUrls.get(date);
      if (previous) URL.revokeObjectURL(previous);
      const url = URL.createObjectURL(processed.blob);
      photoUrls.set(date, url);

      setPhotoDates((current) =>
        current.includes(date) ? current : [...current, date],
      );
    },
    [key],
  );

  const removePhoto = useCallback(async (date: string) => {
    await deletePhoto(date);
    const previous = photoUrls.get(date);
    if (previous) URL.revokeObjectURL(previous);
    photoUrls.delete(date);
    pendingPhotos.delete(date);
    setPhotoDates((current) => current.filter((item) => item !== date));
  }, []);

  const entryDates = useMemo(() => Object.keys(entries).sort(), [entries]);

  const value = useMemo<DataValue>(
    () => ({
      entries,
      entryDates,
      photoDates,
      loading,
      getPhotoUrl,
      saveEntry,
      savePhoto,
      removePhoto,
    }),
    [
      entries,
      entryDates,
      photoDates,
      loading,
      getPhotoUrl,
      saveEntry,
      savePhoto,
      removePhoto,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataValue {
  const value = useContext(DataContext);
  if (!value) throw new Error('useData must be used inside DataProvider');
  return value;
}
