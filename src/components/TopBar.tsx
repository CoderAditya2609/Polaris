import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Logo } from './Logo';
import { SearchPalette } from './SearchPalette';
import { LockIcon, MoonIcon, SearchIcon, SunIcon } from './Icons';

export function TopBar() {
  const { settings, lock } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  const initial = (settings?.displayName ?? 'P').trim().charAt(0).toUpperCase() || 'P';
  const modKey =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '')
      ? '⌘'
      : 'Ctrl';

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && !event.shiftKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
      if (mod && event.shiftKey && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        lock();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lock]);

  return (
    <header className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3.5 sm:px-6 lg:px-8">
      <div className="lg:hidden">
        <Logo compact />
      </div>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="hidden w-full max-w-[340px] items-center gap-2.5 rounded-full border border-[var(--border)] bg-[var(--panel-soft)] px-4 py-2.5 text-left text-[13px] text-[var(--muted)] transition-colors hover:border-[var(--border-strong)] md:flex"
      >
        <SearchIcon className="h-[17px] w-[17px] shrink-0" />
        <span className="flex-1 truncate">Search your journal…</span>
        <kbd className="shrink-0 rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] tracking-wide">
          {modKey} K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="icon-btn md:hidden"
          onClick={() => setSearchOpen(true)}
          aria-label="Search journal"
          title="Search journal"
        >
          <SearchIcon className="h-[18px] w-[18px]" />
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? (
            <SunIcon className="h-[18px] w-[18px]" />
          ) : (
            <MoonIcon className="h-[18px] w-[18px]" />
          )}
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={lock}
          aria-label="Lock journal"
          title={`Lock journal (${modKey}+Shift+L)`}
        >
          <LockIcon className="h-[18px] w-[18px]" />
        </button>

        <Link
          to="/settings"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--gold-soft)] font-serif text-[18px] text-[var(--gold-strong)] transition-transform hover:scale-105"
          aria-label="Open settings"
          title={settings?.displayName ?? 'Settings'}
        >
          {initial}
        </Link>
      </div>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
