import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  getDB,
  getAllEntries,
  getAllPhotos,
  getCheck,
  getKdf,
  getSettingsBox,
  setMeta,
} from '../lib/db';
import {
  CHECK_VALUE,
  KDF_ITERATIONS,
  SALT_BYTES,
  decryptBytes,
  decryptJSON,
  deriveKey,
  encryptBytes,
  encryptJSON,
  randomBytes,
} from '../lib/crypto';
import type {
  EntryPayload,
  EntryRecord,
  KdfMeta,
  PhotoRecord,
  Settings,
} from '../lib/types';

export type AuthStatus = 'loading' | 'setup' | 'locked' | 'unlocked';

interface AuthValue {
  status: AuthStatus;
  key: CryptoKey | null;
  settings: Settings | null;
  busy: boolean;
  setup: (displayName: string, passphrase: string) => Promise<void>;
  unlock: (passphrase: string) => Promise<boolean>;
  lock: () => void;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  changePassphrase: (current: string, next: string) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const DEFAULT_SETTINGS: Settings = { displayName: 'Friend', autoLockMinutes: 5 };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const kdf = await getKdf();
        if (alive) setStatus(kdf ? 'locked' : 'setup');
      } catch {
        if (alive) setStatus('setup');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const lock = useCallback(() => {
    setKey(null);
    setSettings(null);
    setStatus('locked');
  }, []);

  const setup = useCallback(async (displayName: string, passphrase: string) => {
    const name = displayName.trim();
    if (!name) throw new Error('Please choose a display name.');
    if (passphrase.length < 8) {
      throw new Error('Use a passphrase of at least 8 characters.');
    }

    setBusy(true);
    try {
      const salt = randomBytes(SALT_BYTES);
      const derived = await deriveKey(passphrase, salt, KDF_ITERATIONS);
      const check = await encryptJSON(derived, { value: CHECK_VALUE });
      const initialSettings: Settings = {
        displayName: name,
        autoLockMinutes: DEFAULT_SETTINGS.autoLockMinutes,
      };
      const settingsBox = await encryptJSON(derived, initialSettings);

      await setMeta('kdf', { salt, iterations: KDF_ITERATIONS } satisfies KdfMeta);
      await setMeta('check', check);
      await setMeta('settings', settingsBox);

      setKey(derived);
      setSettings(initialSettings);
      setStatus('unlocked');
    } finally {
      setBusy(false);
    }
  }, []);

  const unlock = useCallback(async (passphrase: string) => {
    setBusy(true);
    try {
      const kdf = await getKdf();
      const check = await getCheck();
      if (!kdf || !check) {
        setStatus('setup');
        return false;
      }

      const derived = await deriveKey(passphrase, kdf.salt, kdf.iterations);

      let verified: { value?: string };
      try {
        verified = await decryptJSON<{ value?: string }>(derived, check.iv, check.data);
      } catch {
        return false;
      }
      if (verified.value !== CHECK_VALUE) return false;

      let next: Settings = { ...DEFAULT_SETTINGS };
      const settingsBox = await getSettingsBox();
      if (settingsBox) {
        try {
          const stored = await decryptJSON<Partial<Settings>>(
            derived,
            settingsBox.iv,
            settingsBox.data,
          );
          next = {
            displayName:
              typeof stored.displayName === 'string' && stored.displayName.trim()
                ? stored.displayName
                : DEFAULT_SETTINGS.displayName,
            autoLockMinutes:
              typeof stored.autoLockMinutes === 'number' &&
              Number.isFinite(stored.autoLockMinutes)
                ? stored.autoLockMinutes
                : DEFAULT_SETTINGS.autoLockMinutes,
          };
        } catch {
          next = { ...DEFAULT_SETTINGS };
        }
      }

      setKey(derived);
      setSettings(next);
      setStatus('unlocked');
      return true;
    } finally {
      setBusy(false);
    }
  }, []);

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      if (!key || !settings) throw new Error('Unlock your journal first.');
      const next: Settings = { ...settings, ...patch };
      next.displayName = next.displayName.trim() || settings.displayName;
      next.autoLockMinutes = Math.min(
        120,
        Math.max(1, Math.round(Number(next.autoLockMinutes) || 5)),
      );

      const box = await encryptJSON(key, next);
      await setMeta('settings', box);
      setSettings(next);
    },
    [key, settings],
  );

  const changePassphrase = useCallback(
    async (current: string, next: string) => {
      if (!key || !settings) throw new Error('Unlock your journal first.');
      if (next.length < 8) {
        throw new Error('Use a new passphrase of at least 8 characters.');
      }

      setBusy(true);
      try {
        const check = await getCheck();
        if (!check) throw new Error('This journal has not been initialised.');

        const kdf = await getKdf();
        if (!kdf) throw new Error('This journal has not been initialised.');

        try {
          const currentKey = await deriveKey(current, kdf.salt, kdf.iterations);
          await decryptJSON(currentKey, check.iv, check.data);
        } catch {
          throw new Error('The current passphrase is incorrect.');
        }

        const salt = randomBytes(SALT_BYTES);
        const newKey = await deriveKey(next, salt, KDF_ITERATIONS);

        const [entries, photos] = await Promise.all([getAllEntries(), getAllPhotos()]);
        const newEntries: EntryRecord[] = [];
        for (const entry of entries) {
          const payload = await decryptJSON<EntryPayload>(key, entry.iv, entry.data);
          const box = await encryptJSON(newKey, payload);
          newEntries.push({
            date: entry.date,
            updatedAt: entry.updatedAt,
            iv: box.iv,
            data: box.data,
          });
        }

        const newPhotos: PhotoRecord[] = [];
        for (const photo of photos) {
          const bytes = await decryptBytes(key, photo.iv, photo.data);
          const box = await encryptBytes(newKey, bytes);
          newPhotos.push({
            date: photo.date,
            mime: photo.mime,
            iv: box.iv,
            data: box.data,
          });
        }

        const newCheck = await encryptJSON(newKey, { value: CHECK_VALUE });
        const newSettings = await encryptJSON(newKey, settings);

        const db = await getDB();
        const tx = db.transaction(['meta', 'entries', 'photos'], 'readwrite');
        const metaStore = tx.objectStore('meta');
        const entryStore = tx.objectStore('entries');
        const photoStore = tx.objectStore('photos');

        const puts: Promise<unknown>[] = [
          metaStore.put({ salt, iterations: KDF_ITERATIONS } satisfies KdfMeta, 'kdf'),
          metaStore.put(newCheck, 'check'),
          metaStore.put(newSettings, 'settings'),
        ];
        for (const entry of newEntries) puts.push(entryStore.put(entry));
        for (const photo of newPhotos) puts.push(photoStore.put(photo));
        await Promise.all(puts);
        await tx.done;

        setKey(newKey);
      } finally {
        setBusy(false);
      }
    },
    [key, settings],
  );

  useEffect(() => {
    if (status !== 'unlocked' || !settings || busy) return;
    const timeoutMs = Math.max(1, settings.autoLockMinutes) * 60_000;
    let timer = 0;

    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => lock(), timeoutMs);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];
    for (const event of events) {
      window.addEventListener(event, reset, { passive: true });
    }
    reset();

    return () => {
      window.clearTimeout(timer);
      for (const event of events) window.removeEventListener(event, reset);
    };
  }, [status, settings, busy, lock]);

  return (
    <AuthContext.Provider
      value={{ status, key, settings, busy, setup, unlock, lock, updateSettings, changePassphrase }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
