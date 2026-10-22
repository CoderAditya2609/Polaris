import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeOffIcon, LockIcon, LogoMark } from './Icons';

export function LockScreen() {
  const { unlock, busy } = useAuth();
  const [passphrase, setPassphrase] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice] = useState<string | null>(() => {
    try {
      return localStorage.getItem('polaris:notice');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!notice) return;
    try {
      localStorage.removeItem('polaris:notice');
    } catch {
      /* ignore */
    }
  }, [notice]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!passphrase) {
      setError('Enter your passphrase to unlock.');
      return;
    }
    setError(null);
    const ok = await unlock(passphrase);
    if (!ok) {
      setError('That passphrase is incorrect. Try again.');
      setPassphrase('');
    }
  };

  return (
    <div className="grid min-h-[100dvh] place-items-center px-4 py-10">
      <div className="glass-strong animate-fade-up w-full max-w-[420px] rounded-[26px] px-7 py-9 text-center sm:px-9">
        <LogoMark className="mx-auto h-12 w-12 text-[var(--gold)] drop-shadow-[0_0_18px_rgba(227,201,155,0.4)]" />
        <h1 className="mt-4 font-serif text-[40px] leading-none tracking-wide text-[var(--text)]">
          Polaris
        </h1>
        <p className="mt-2 font-serif text-[14px] text-[var(--muted)]">Same sky. New thoughts.</p>

        <div className="my-7 h-px w-full bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />

        <h2 className="font-serif text-2xl text-[var(--text)]">Welcome back</h2>
        <p className="mt-1.5 text-[13px] text-[var(--muted)]">
          Enter your passphrase to open your journal.
        </p>

        <form onSubmit={(event) => void onSubmit(event)} className="mt-6 text-left">
          <label
            htmlFor="lock-passphrase"
            className="mb-1.5 block text-[10.5px] uppercase tracking-[0.18em] text-[var(--muted)]"
          >
            Passphrase
          </label>
          <div className="relative">
            <input
              id="lock-passphrase"
              type={show ? 'text' : 'password'}
              value={passphrase}
              onChange={(event) => {
                setPassphrase(event.target.value);
                setError(null);
              }}
              autoFocus
              autoComplete="current-password"
              placeholder="Your passphrase"
              className="field pr-11"
            />
            <button
              type="button"
              onClick={() => setShow((value) => !value)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:text-[var(--text)]"
              aria-label={show ? 'Hide passphrase' : 'Show passphrase'}
            >
              {show ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>

          {error ? (
            <p role="alert" className="mt-2.5 text-[12.5px] text-[var(--danger)]">
              {error}
            </p>
          ) : null}
          {notice && !error ? (
            <p className="mt-2.5 text-[12.5px] text-[var(--success)]">{notice}</p>
          ) : null}

          <button type="submit" className="btn-gold mt-5 w-full" disabled={busy}>
            {busy ? 'Unlocking…' : 'Unlock Journal'}
          </button>
        </form>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[var(--muted)]">
          <LockIcon className="h-3.5 w-3.5" />
          Encrypted on this device · no account, no cloud
        </p>
      </div>
    </div>
  );
}
