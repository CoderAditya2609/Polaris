import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Modal } from '../components/Modal';
import {
  DownloadIcon,
  LockIcon,
  MoonIcon,
  ShieldIcon,
  SunIcon,
  UploadIcon,
} from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { buildBackup, downloadBackup, restoreBackup } from '../lib/backup';
import type { ThemeName } from '../lib/types';

interface NoticeState {
  tone: 'ok' | 'err';
  text: string;
}

const AUTO_LOCK_OPTIONS = [1, 5, 10, 15, 30, 60];

export function SettingsPage() {
  const { settings, updateSettings, changePassphrase, lock, busy } = useAuth();
  const { entryDates, photoDates } = useData();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(settings?.displayName ?? '');
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileNotice, setProfileNotice] = useState<NoticeState | null>(null);

  const [autoLock, setAutoLock] = useState(settings?.autoLockMinutes ?? 5);
  const [autoLockNotice, setAutoLockNotice] = useState<NoticeState | null>(null);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passBusy, setPassBusy] = useState(false);
  const [passNotice, setPassNotice] = useState<NoticeState | null>(null);

  const [backupBusy, setBackupBusy] = useState(false);
  const [backupNotice, setBackupNotice] = useState<NoticeState | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importPass, setImportPass] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(settings?.displayName ?? '');
  }, [settings?.displayName]);

  useEffect(() => {
    setAutoLock(settings?.autoLockMinutes ?? 5);
  }, [settings?.autoLockMinutes]);

  const initial = (name || settings?.displayName || 'P').trim().charAt(0).toUpperCase() || 'P';

  const saveProfile = async () => {
    setProfileBusy(true);
    setProfileNotice(null);
    try {
      await updateSettings({ displayName: name });
      setProfileNotice({ tone: 'ok', text: 'Display name saved.' });
    } catch (cause) {
      setProfileNotice({
        tone: 'err',
        text: cause instanceof Error ? cause.message : 'Could not save your name.',
      });
    } finally {
      setProfileBusy(false);
    }
  };

  const changeAutoLock = async (value: number) => {
    setAutoLock(value);
    setAutoLockNotice(null);
    try {
      await updateSettings({ autoLockMinutes: value });
      setAutoLockNotice({ tone: 'ok', text: 'Auto-lock updated.' });
    } catch (cause) {
      setAutoLockNotice({
        tone: 'err',
        text: cause instanceof Error ? cause.message : 'Could not update auto-lock.',
      });
    }
  };

  const submitPassphrase = async (event: FormEvent) => {
    event.preventDefault();
    if (newPass.length < 8) {
      setPassNotice({ tone: 'err', text: 'Use a new passphrase of at least 8 characters.' });
      return;
    }
    if (newPass !== confirmPass) {
      setPassNotice({ tone: 'err', text: 'Those new passphrases do not match.' });
      return;
    }
    setPassBusy(true);
    setPassNotice(null);
    try {
      await changePassphrase(currentPass, newPass);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setPassNotice({
        tone: 'ok',
        text: 'Passphrase changed. Every entry and photo was re-encrypted.',
      });
    } catch (cause) {
      setPassNotice({
        tone: 'err',
        text: cause instanceof Error ? cause.message : 'Could not change the passphrase.',
      });
    } finally {
      setPassBusy(false);
    }
  };

  const exportBackup = async () => {
    setBackupBusy(true);
    setBackupNotice(null);
    try {
      const backup = await buildBackup();
      downloadBackup(backup);
      setBackupNotice({ tone: 'ok', text: 'Encrypted backup downloaded.' });
    } catch (cause) {
      setBackupNotice({
        tone: 'err',
        text: cause instanceof Error ? cause.message : 'Could not build a backup.',
      });
    } finally {
      setBackupBusy(false);
    }
  };

  const pickBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;
    setPendingFile(file);
    setImportPass('');
    setImportError(null);
  };

  const closeImport = () => {
    if (importBusy) return;
    setPendingFile(null);
    setImportError(null);
  };

  const doImport = async () => {
    if (!pendingFile) return;
    if (!importPass) {
      setImportError('Enter the passphrase that protects this backup.');
      return;
    }
    setImportBusy(true);
    setImportError(null);
    try {
      await restoreBackup(pendingFile, importPass);
      try {
        localStorage.setItem(
          'polaris:notice',
          'Backup restored. Unlock with the passphrase that protects it.',
        );
      } catch {
        /* ignore */
      }
      setPendingFile(null);
      lock();
    } catch (cause) {
      setImportError(
        cause instanceof Error ? cause.message : 'That backup could not be restored.',
      );
    } finally {
      setImportBusy(false);
    }
  };

  return (
    <>
      <div className="animate-fade-up mx-auto w-full max-w-[1100px] px-4 pb-14 pt-6 sm:px-7 sm:pt-8">
        <header className="mb-6">
          <h1 className="font-serif text-[44px] leading-none tracking-[0.01em] text-[var(--text)] sm:text-[54px]">
            Settings
          </h1>
          <p className="mt-2 font-serif text-[17px] italic text-[var(--muted)]">
            Keep your corner of the sky just as you like it.
          </p>
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-2">
          <Panel title="Profile" description="How Polaris greets you.">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--gold-soft)] font-serif text-[30px] text-[var(--gold-strong)]">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <Label htmlFor="settings-name">Display name</Label>
                <input
                  id="settings-name"
                  type="text"
                  value={name}
                  maxLength={40}
                  onChange={(event) => {
                    setName(event.target.value);
                    setProfileNotice(null);
                  }}
                  className="field"
                  placeholder="Your name"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn-gold !px-4 !py-2 text-[12.5px]"
                onClick={() => void saveProfile()}
                disabled={profileBusy || !name.trim()}
              >
                {profileBusy ? 'Saving…' : 'Save profile'}
              </button>
              {profileNotice ? <Notice state={profileNotice} /> : null}
            </div>
          </Panel>

          <Panel title="Appearance" description="The same sky, at your preferred hour.">
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  { value: 'dark', label: 'Night', Icon: MoonIcon },
                  { value: 'light', label: 'Day', Icon: SunIcon },
                ] as Array<{ value: ThemeName; label: string; Icon: typeof MoonIcon }>
              ).map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[13px] transition-colors ${
                    theme === value
                      ? 'border-[var(--border-strong)] bg-[var(--gold-soft)] text-[var(--text)]'
                      : 'border-[var(--border)] bg-[var(--panel-soft)] text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-4 text-[11.5px] leading-relaxed text-[var(--muted)]">
              Night is the original Polaris mood. Day keeps the same frosted panels over the
              sky, with warmer paper tones.
            </p>
          </Panel>

          <Panel
            title="Security"
            description="Locks, passphrases and quiet-time timeouts."
            className="lg:row-span-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] text-[var(--text)]">Auto-lock when idle</p>
                <p className="mt-0.5 text-[11.5px] text-[var(--muted)]">
                  Polaris locks itself after a quiet spell.
                </p>
              </div>
              <select
                aria-label="Auto-lock timer"
                className="field w-[150px]"
                value={autoLock}
                onChange={(event) => void changeAutoLock(Number(event.target.value))}
                disabled={busy}
              >
                {AUTO_LOCK_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes === 1 ? '1 minute' : `${minutes} minutes`}
                  </option>
                ))}
              </select>
            </div>
            {autoLockNotice ? (
              <div className="mt-2">
                <Notice state={autoLockNotice} />
              </div>
            ) : null}

            <div className="my-5 h-px bg-[var(--border)]" />

            <h3 className="font-serif text-[21px] text-[var(--text)]">Change passphrase</h3>
            <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--muted)]">
              Every entry and photo is decrypted and re-encrypted with the new key. There is
              still no recovery if it is forgotten.
            </p>

            <form onSubmit={(event) => void submitPassphrase(event)} className="mt-3 space-y-3">
              <div>
                <Label htmlFor="current-pass">Current passphrase</Label>
                <input
                  id="current-pass"
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPass}
                  onChange={(event) => {
                    setCurrentPass(event.target.value);
                    setPassNotice(null);
                  }}
                  autoComplete="current-password"
                  className="field"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="new-pass">New passphrase</Label>
                  <input
                    id="new-pass"
                    type={showPasswords ? 'text' : 'password'}
                    value={newPass}
                    onChange={(event) => {
                      setNewPass(event.target.value);
                      setPassNotice(null);
                    }}
                    autoComplete="new-password"
                    className="field"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-pass">Confirm new</Label>
                  <input
                    id="confirm-pass"
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPass}
                    onChange={(event) => {
                      setConfirmPass(event.target.value);
                      setPassNotice(null);
                    }}
                    autoComplete="new-password"
                    className="field"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-[11.5px] text-[var(--muted)]">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={(event) => setShowPasswords(event.target.checked)}
                  className="h-3.5 w-3.5 accent-[#c9a86f]"
                />
                Show passphrases
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="btn-gold !px-4 !py-2.5 text-[12.5px]"
                  disabled={passBusy || busy}
                >
                  {passBusy ? 'Re-encrypting…' : 'Change passphrase'}
                </button>
                {passNotice ? <Notice state={passNotice} /> : null}
              </div>
            </form>

            <div className="my-5 h-px bg-[var(--border)]" />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] text-[var(--text)]">Lock now</p>
                <p className="mt-0.5 text-[11.5px] text-[var(--muted)]">
                  Clears all decrypted entries from memory.
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost !px-4 !py-2 text-[12.5px]"
                onClick={lock}
              >
                <LockIcon className="h-4 w-4" />
                Lock journal
              </button>
            </div>
          </Panel>

          <Panel title="Backup" description="One encrypted file — yours to keep.">
            <p className="text-[12.5px] leading-relaxed text-[var(--muted)]">
              The export contains your encrypted entries, photos, salt and check value. It is
              protected by the passphrase in use at the time of export.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                className="btn-ghost !px-4 !py-2.5 text-[12.5px]"
                onClick={() => void exportBackup()}
                disabled={backupBusy}
              >
                <DownloadIcon className="h-4 w-4" />
                {backupBusy ? 'Preparing…' : 'Export backup'}
              </button>
              <button
                type="button"
                className="btn-ghost !px-4 !py-2.5 text-[12.5px]"
                onClick={() => importInputRef.current?.click()}
              >
                <UploadIcon className="h-4 w-4" />
                Import backup
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={pickBackup}
              />
            </div>
            {backupNotice ? (
              <div className="mt-3">
                <Notice state={backupNotice} />
              </div>
            ) : null}
            <p className="mt-3 text-[11px] text-[var(--muted)]">
              Importing replaces everything currently in this journal.
            </p>
          </Panel>

          <Panel title="On this device" description="Nothing leaves your browser.">
            <dl className="space-y-2.5 text-[12.5px]">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--muted)]">Entries</dt>
                <dd className="text-[var(--text)]">{entryDates.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--muted)]">Polaroids</dt>
                <dd className="text-[var(--text)]">{photoDates.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--muted)]">Encryption</dt>
                <dd className="text-[var(--text)]">AES-256-GCM</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--muted)]">Key derivation</dt>
                <dd className="text-[var(--text)]">PBKDF2 · 600k</dd>
              </div>
            </dl>
            <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-[var(--muted)]">
              <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
              No accounts, no network calls, no analytics. Just you, this device and the sky.
            </p>
          </Panel>
        </div>
      </div>

      <Modal
        open={Boolean(pendingFile)}
        onClose={closeImport}
        label="Restore backup"
        className="max-w-md px-6 pb-6 pt-7 sm:px-7"
      >
        <h2 className="font-serif text-[29px] leading-none text-[var(--text)]">Restore backup</h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--muted)]">
          Enter the passphrase that protects{' '}
          <span className="text-[var(--text)]">{pendingFile?.name}</span>.
        </p>

        <div className="mt-4">
          <Label htmlFor="import-pass">Backup passphrase</Label>
          <input
            id="import-pass"
            type="password"
            value={importPass}
            onChange={(event) => {
              setImportPass(event.target.value);
              setImportError(null);
            }}
            className="field"
            autoFocus
          />
        </div>

        <p className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--panel-soft)] px-3 py-2 text-[11.5px] leading-relaxed text-[var(--danger)]">
          This replaces all entries and photos currently stored in Polaris.
        </p>

        {importError ? (
          <p role="alert" className="mt-2.5 text-[12.5px] text-[var(--danger)]">
            {importError}
          </p>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="btn-ghost !px-4 !py-2.5 text-[12.5px]"
            onClick={closeImport}
            disabled={importBusy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-gold !px-4 !py-2.5 text-[12.5px]"
            onClick={() => void doImport()}
            disabled={importBusy}
          >
            {importBusy ? 'Restoring…' : 'Restore backup'}
          </button>
        </div>
      </Modal>
    </>
  );
}

function Panel({
  title,
  description,
  className = '',
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`glass rounded-2xl px-5 pb-6 pt-5 sm:px-6 ${className}`}>
      <h2 className="font-serif text-[26px] leading-none text-[var(--text)]">{title}</h2>
      {description ? (
        <p className="mt-1.5 text-[12px] text-[var(--muted)]">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[10.5px] uppercase tracking-[0.16em] text-[var(--muted)]"
    >
      {children}
    </label>
  );
}

function Notice({ state }: { state: NoticeState }) {
  return (
    <p
      role={state.tone === 'err' ? 'alert' : 'status'}
      className={`text-[11.5px] leading-relaxed ${
        state.tone === 'ok' ? 'text-[var(--success)]' : 'text-[var(--danger)]'
      }`}
    >
      {state.text}
    </p>
  );
}
