import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  LogoMark,
  ShieldIcon,
} from './Icons';

export function SetupScreen() {
  const { setup, busy } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!displayName.trim()) {
      setError('Please add a display name.');
      return;
    }
    if (passphrase.length < 8) {
      setError('Use a passphrase of at least 8 characters.');
      return;
    }
    if (passphrase !== confirm) {
      setError('Those passphrases do not match.');
      return;
    }
    if (!acknowledged) {
      setError('Please confirm that you understand the passphrase cannot be recovered.');
      return;
    }

    setError(null);
    try {
      await setup(displayName, passphrase);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Try again.');
    }
  };

  return (
    <div className="grid min-h-[100dvh] place-items-center px-4 py-10">
      <div className="glass-strong animate-fade-up w-full max-w-[480px] rounded-[26px] px-7 py-9 sm:px-9">
        <div className="text-center">
          <LogoMark className="mx-auto h-12 w-12 text-[var(--gold)] drop-shadow-[0_0_18px_rgba(227,201,155,0.4)]" />
          <h1 className="mt-4 font-serif text-[38px] leading-none tracking-wide text-[var(--text)]">
            Polaris
          </h1>
          <p className="mt-2 font-serif text-[14px] text-[var(--muted)]">Same sky. New thoughts.</p>
        </div>

        <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />

        <h2 className="text-center font-serif text-[27px] leading-tight text-[var(--text)]">
          Begin your journal
        </h2>
        <p className="mt-1.5 text-center text-[13px] text-[var(--muted)]">
          A quiet, private place for your days.
        </p>

        <form onSubmit={(event) => void onSubmit(event)} className="mt-6">
          <label
            htmlFor="setup-name"
            className="mb-1.5 block text-[10.5px] uppercase tracking-[0.18em] text-[var(--muted)]"
          >
            Display name
          </label>
          <input
            id="setup-name"
            type="text"
            value={displayName}
            onChange={(event) => {
              setDisplayName(event.target.value);
              setError(null);
            }}
            maxLength={40}
            autoComplete="nickname"
            placeholder="What should Polaris call you?"
            className="field"
          />

          <div className="mt-4">
            <label
              htmlFor="setup-passphrase"
              className="mb-1.5 block text-[10.5px] uppercase tracking-[0.18em] text-[var(--muted)]"
            >
              Passphrase
            </label>
            <div className="relative">
              <input
                id="setup-passphrase"
                type={show ? 'text' : 'password'}
                value={passphrase}
                onChange={(event) => {
                  setPassphrase(event.target.value);
                  setError(null);
                }}
                autoComplete="new-password"
                placeholder="At least 8 characters"
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
          </div>

          <div className="mt-4">
            <label
              htmlFor="setup-confirm"
              className="mb-1.5 block text-[10.5px] uppercase tracking-[0.18em] text-[var(--muted)]"
            >
              Confirm passphrase
            </label>
            <input
              id="setup-confirm"
              type={show ? 'text' : 'password'}
              value={confirm}
              onChange={(event) => {
                setConfirm(event.target.value);
                setError(null);
              }}
              autoComplete="new-password"
              placeholder="Type it once more"
              className="field"
            />
          </div>

          <div className="mt-5 rounded-xl border border-[var(--border-strong)] bg-[var(--gold-soft)] p-3.5">
            <div className="flex gap-2.5">
              <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold-strong)]" />
              <p className="text-[12px] leading-relaxed text-[var(--muted)]">
                <span className="font-medium text-[var(--text)]">There is no recovery.</span> Your
                passphrase is never stored, and no one — not even Polaris — can reset it. If you
                forget it, your journal and photos cannot be recovered.
              </p>
            </div>
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-left text-[12px] leading-relaxed text-[var(--muted)]">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => {
                setAcknowledged(event.target.checked);
                setError(null);
              }}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#c9a86f]"
            />
            I understand that if I forget my passphrase, my journal cannot be recovered.
          </label>

          {error ? (
            <p role="alert" className="mt-3 text-[12.5px] text-[var(--danger)]">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn-gold mt-5 w-full" disabled={busy}>
            {busy ? 'Preparing your journal…' : 'Create my journal'}
          </button>
        </form>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[var(--muted)]">
          <LockIcon className="h-3.5 w-3.5" />
          Everything stays encrypted on this device
        </p>
      </div>
    </div>
  );
}
