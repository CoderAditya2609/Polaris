import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Editor } from '../components/Editor';
import { MoodPicker } from '../components/MoodPicker';
import { PhotoPickerModal } from '../components/PhotoPickerModal';
import { PolaroidCard, PolaroidNote } from '../components/Polaroid';
import { useData } from '../context/DataContext';
import {
  addDays,
  formatLongDate,
  isDateKey,
  todayKey,
} from '../lib/date';
import type { Entry, Mood } from '../lib/types';
import {
  ArrowRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LockIcon,
} from '../components/Icons';

export function JournalPage() {
  const { date: dateParam } = useParams();
  const navigate = useNavigate();
  const { entries, loading } = useData();
  const date = isDateKey(dateParam) ? dateParam : todayKey();

  const handleChangeDate = useCallback(
    (next: string) => {
      navigate(next === todayKey() ? '/' : `/journal/${next}`);
    },
    [navigate],
  );

  if (loading) return <JournalSkeleton />;

  return (
    <JournalEditor
      key={date}
      date={date}
      initial={entries[date]}
      onChangeDate={handleChangeDate}
    />
  );
}

function JournalEditor({
  date,
  initial,
  onChangeDate,
}: {
  date: string;
  initial?: Entry;
  onChangeDate: (date: string) => void;
}) {
  const { saveEntry, savePhoto, removePhoto, photoDates, getPhotoUrl } = useData();
  const today = todayKey();
  const isToday = date === today;

  const [title, setTitle] = useState(initial?.title ?? '');
  const [html, setHtml] = useState(initial?.html ?? '');
  const [mood, setMood] = useState<Mood | null>(initial?.mood ?? null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isDirty, setIsDirty] = useState(false);

  const dirtyRef = useRef(false);
  const latestRef = useRef({ title, html, mood });
  latestRef.current = { title, html, mood };
  const saveTimer = useRef<number | undefined>(undefined);
  const persistRef = useRef<() => Promise<void>>(async () => undefined);

  const hasPhoto = photoDates.includes(date);

  useEffect(() => {
    let alive = true;
    setPhotoUrl(null);
    void getPhotoUrl(date).then((url) => {
      if (alive) setPhotoUrl(url);
    });
    return () => {
      alive = false;
    };
  }, [date, getPhotoUrl]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setIsDirty(true);
    setStatus('idle');
  }, []);

  const persist = useCallback(async () => {
    if (!dirtyRef.current) return;
    setStatus('saving');
    try {
      await saveEntry(date, latestRef.current);
      dirtyRef.current = false;
      setIsDirty(false);
      setStatus('saved');
    } catch {
      setStatus('idle');
    }
  }, [date, saveEntry]);

  persistRef.current = persist;

  useEffect(() => {
    if (!dirtyRef.current) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void persist();
    }, 1200);
    return () => window.clearTimeout(saveTimer.current);
  }, [title, html, mood, persist]);

  useEffect(() => {
    return () => {
      window.clearTimeout(saveTimer.current);
      if (dirtyRef.current) void persistRef.current();
    };
  }, []);

  const handleTitleChange = (value: string) => {
    markDirty();
    setTitle(value);
  };

  const handleHtmlChange = (value: string) => {
    markDirty();
    setHtml(value);
  };

  const handleMoodChange = (value: Mood | null) => {
    markDirty();
    setMood(value);
  };

  const handleSave = () => {
    window.clearTimeout(saveTimer.current);
    void persist();
  };

  const handlePhotoSave = async (file: Blob) => {
    await savePhoto(date, file);
    const url = await getPhotoUrl(date);
    setPhotoUrl(url);
  };

  const handlePhotoRemove = async () => {
    await removePhoto(date);
    setPhotoUrl(null);
  };

  const statusLabel =
    status === 'saving' ? 'Saving…' : isDirty ? 'Unsaved changes' : 'Auto-saved';

  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 pb-12 pt-6 sm:px-7 sm:pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DatePicker date={date} onChange={onChangeDate} />
        <MoodPicker value={mood} onChange={handleMoodChange} />
      </div>

      <h1 className="mt-4 font-serif text-[44px] leading-[1.02] tracking-[0.01em] text-[var(--text)] sm:mt-5 sm:text-[58px]">
        {isToday ? "Today's Journal" : 'Journal'}
      </h1>

      <input
        type="text"
        value={title}
        onChange={(event) => handleTitleChange(event.target.value)}
        maxLength={140}
        aria-label="Entry title"
        placeholder="Pause. Breathe. Write what’s on your mind…"
        className="title-input mt-2 max-w-[640px]"
      />

      <div className="mt-6 flex items-start gap-8 sm:mt-7">
        <PolaroidCard
          date={date}
          hasPhoto={hasPhoto}
          src={photoUrl}
          onAdd={() => setPickerOpen(true)}
          onRemove={() => void handlePhotoRemove()}
        />
        <PolaroidNote />
      </div>

      <div className="mt-7">
        <Editor
          initialHtml={initial?.html ?? ''}
          onChange={handleHtmlChange}
          footer={
            <>
              <span className="flex items-center gap-2 text-[11.5px] text-[var(--muted)]">
                {status === 'saving' ? (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--gold)]" />
                ) : (
                  <LockIcon className="h-3.5 w-3.5" />
                )}
                {statusLabel}
              </span>
              <button
                type="button"
                className="btn-gold !px-5 !py-2.5 text-[13px]"
                onClick={handleSave}
                disabled={status === 'saving'}
              >
                <span>Save Entry</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </>
          }
        />
      </div>

      <PhotoPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        previewUrl={photoUrl}
        hasPhoto={hasPhoto}
        onSave={handlePhotoSave}
        onRemove={handlePhotoRemove}
      />
    </div>
  );
}

function DatePicker({
  date,
  onChange,
}: {
  date: string;
  onChange: (date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="chip"
      >
        <CalendarIcon className="h-4 w-4" />
        <span>{formatLongDate(date)}</span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div
          className="glass-strong absolute left-0 top-full z-30 mt-2 w-[270px] rounded-xl p-3"
          role="dialog"
          aria-label="Choose a date"
        >
          <label
            htmlFor="journal-date"
            className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]"
          >
            Jump to a day
          </label>
          <input
            id="journal-date"
            type="date"
            value={date}
            onChange={(event) => {
              if (isDateKey(event.target.value)) choose(event.target.value);
            }}
            className="field"
          />
          <div className="mt-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => choose(addDays(date, -1))}
              className="chip flex-1 justify-center !px-2"
              aria-label="Previous day"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => choose(todayKey())}
              className="chip flex-[2] justify-center !px-3"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => choose(addDays(date, 1))}
              className="chip flex-1 justify-center !px-2"
              aria-label="Next day"
            >
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function JournalSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 py-8 sm:px-7">
      <div className="flex items-center justify-between">
        <div className="h-8 w-52 animate-pulse rounded-full bg-white/10" />
        <div className="hidden h-8 w-52 animate-pulse rounded-full bg-white/10 sm:block" />
      </div>
      <div className="mt-5 h-14 w-80 animate-pulse rounded-lg bg-white/10" />
      <div className="mt-3 h-6 w-96 max-w-full animate-pulse rounded bg-white/5" />
      <div className="mt-8 flex gap-8">
        <div className="h-[300px] w-[260px] animate-pulse rounded-sm bg-white/10" />
        <div className="mt-16 hidden h-16 w-36 animate-pulse rounded bg-white/5 sm:block" />
      </div>
      <div className="mt-8 h-[320px] w-full animate-pulse rounded-2xl bg-white/5" />
    </div>
  );
}
