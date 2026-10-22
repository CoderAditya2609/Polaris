import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { formatShortDate } from '../lib/date';
import { htmlToText } from '../lib/html';
import { SearchIcon } from './Icons';

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const { entries } = useData();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return Object.values(entries)
      .map((entry) => ({ entry, text: htmlToText(entry.html) }))
      .filter(({ entry, text }) =>
        `${entry.title} ${text}`.toLowerCase().includes(needle),
      )
      .sort((a, b) => b.entry.date.localeCompare(a.entry.date))
      .slice(0, 8);
  }, [entries, query]);

  const openEntry = (date: string) => {
    onClose();
    navigate(`/journal/${date}`);
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 pt-[10vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search journal"
    >
      <div className="glass-strong mx-auto w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <SearchIcon className="h-5 w-5 shrink-0 text-[var(--muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && results[0]) {
                event.preventDefault();
                openEntry(results[0].entry.date);
              }
            }}
            placeholder="Search your journal…"
            className="w-full bg-transparent text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
            aria-label="Search your journal"
          />
          <kbd className="hidden shrink-0 rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)] sm:block">
            esc
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {query.trim() === '' ? (
            <p className="px-3 py-6 text-center text-sm text-[var(--muted)]">
              Search across your titles and words.
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[var(--muted)]">
              No entries match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            results.map(({ entry, text }) => (
              <button
                key={entry.date}
                type="button"
                onClick={() => openEntry(entry.date)}
                className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--panel-soft)]"
              >
                <span className="mt-1 w-[52px] shrink-0 text-[10.5px] uppercase tracking-[0.08em] text-[var(--muted)]">
                  {formatShortDate(entry.date)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-[18px] text-[var(--text)]">
                    {entry.title || 'Untitled entry'}
                  </span>
                  {text ? (
                    <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">
                      {text.slice(0, 140)}
                    </span>
                  ) : null}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2.5 text-[11px] text-[var(--muted)]">
          <span>
            <kbd className="rounded border border-[var(--border)] px-1 py-0.5">↵</kbd> to open
          </span>
          <span>
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
