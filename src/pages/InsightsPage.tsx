import { useMemo, type ReactNode } from 'react';
import { InsightsIcon, JournalIcon, PolaroidIcon, SparkIcon } from '../components/Icons';
import { useData } from '../context/DataContext';
import { todayKey, writingStreak } from '../lib/date';
import { htmlToText } from '../lib/html';
import type { Mood } from '../lib/types';

const MOODS: Array<{ value: Mood; label: string }> = [
  { value: 'heavy', label: 'Heavy' },
  { value: 'low', label: 'Low' },
  { value: 'steady', label: 'Steady' },
  { value: 'good', label: 'Good' },
  { value: 'radiant', label: 'Radiant' },
];

export function InsightsPage() {
  const { entries, entryDates, photoDates } = useData();

  const streak = useMemo(() => writingStreak(entryDates, todayKey()), [entryDates]);
  const words = useMemo(
    () =>
      entryDates.reduce((sum, date) => {
        const text = htmlToText(entries[date]?.html ?? '');
        return sum + (text ? text.split(/\s+/).filter(Boolean).length : 0);
      }, 0),
    [entries, entryDates],
  );

  const moodCounts = useMemo(() => {
    const counts: Record<Mood, number> = {
      heavy: 0,
      low: 0,
      steady: 0,
      good: 0,
      radiant: 0,
    };
    for (const date of entryDates) {
      const mood = entries[date]?.mood;
      if (mood) counts[mood] += 1;
    }
    return counts;
  }, [entries, entryDates]);

  const moodTotal = Object.values(moodCounts).reduce((sum, count) => sum + count, 0);
  const formatter = useMemo(() => new Intl.NumberFormat(), []);

  return (
    <div className="animate-fade-up mx-auto w-full max-w-[1100px] px-4 pb-12 pt-6 sm:px-7 sm:pt-8">
      <header className="mb-6">
        <h1 className="font-serif text-[44px] leading-none tracking-[0.01em] text-[var(--text)] sm:text-[54px]">
          Insights
        </h1>
        <p className="mt-2 font-serif text-[17px] italic text-[var(--muted)]">
          A quiet look at your writing.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<SparkIcon className="h-5 w-5" />}
          label="Writing streak"
          value={formatter.format(streak)}
          suffix={streak === 1 ? 'day' : 'days'}
          hint="Consecutive days with an entry."
        />
        <StatCard
          icon={<JournalIcon className="h-5 w-5" />}
          label="Total entries"
          value={formatter.format(entryDates.length)}
          suffix={entryDates.length === 1 ? 'entry' : 'entries'}
          hint="Every page you have saved."
        />
        <StatCard
          icon={<PolaroidIcon className="h-5 w-5" />}
          label="Polaroids"
          value={formatter.format(photoDates.length)}
          suffix={photoDates.length === 1 ? 'photo' : 'photos'}
          hint="Moments kept on your wall."
        />
        <StatCard
          icon={<InsightsIcon className="h-5 w-5" />}
          label="Words written"
          value={formatter.format(words)}
          suffix="words"
          hint="Counted locally, never sent anywhere."
        />
      </div>

      <section className="glass mt-5 rounded-2xl px-5 pb-6 pt-6 sm:px-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-[27px] leading-none text-[var(--text)]">
              Mood breakdown
            </h2>
            <p className="mt-1.5 text-[12px] text-[var(--muted)]">
              {moodTotal === 0
                ? 'Your moods will gather here as you write.'
                : `${moodTotal} ${moodTotal === 1 ? 'check-in' : 'check-ins'} recorded.`}
            </p>
          </div>
          <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
            All time
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {MOODS.map((mood) => {
            const count = moodCounts[mood.value];
            const percent = moodTotal === 0 ? 0 : Math.round((count / moodTotal) * 100);
            return (
              <div key={mood.value} className="flex items-center gap-3 sm:gap-4">
                <span className="w-[58px] shrink-0 text-[12.5px] text-[var(--muted)] sm:w-16">
                  {mood.label}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--panel-soft)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#a3814f] to-[var(--gold)] transition-[width] duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-[12px] text-[var(--muted)]">
                  {count > 0 ? `${percent}%` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <p className="mt-5 px-1 text-[11px] text-[var(--muted)]">
        Streaks, counts and moods are computed from your decrypted entries, in memory, on this
        device.
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  suffix: string;
  hint: string;
}) {
  return (
    <div className="glass rounded-2xl px-5 pb-5 pt-5">
      <div className="flex items-center gap-2 text-[var(--gold)]">
        {icon}
        <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
          {label}
        </span>
      </div>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="font-serif text-[38px] leading-none text-[var(--text)]">{value}</span>
        <span className="text-[12px] text-[var(--muted)]">{suffix}</span>
      </p>
      <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--muted)]">{hint}</p>
    </div>
  );
}
