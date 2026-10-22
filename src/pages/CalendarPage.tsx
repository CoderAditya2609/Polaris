import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarGrid } from '../components/CalendarGrid';
import { useData } from '../context/DataContext';
import { shiftMonth } from '../lib/date';

export function CalendarPage() {
  const navigate = useNavigate();
  const { entryDates, photoDates } = useData();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const entrySet = useMemo(() => new Set(entryDates), [entryDates]);
  const photoSet = useMemo(() => new Set(photoDates), [photoDates]);

  const goToday = () => {
    const date = new Date();
    setCursor({ year: date.getFullYear(), month: date.getMonth() });
  };

  return (
    <div className="animate-fade-up mx-auto w-full max-w-[1100px] px-4 pb-12 pt-6 sm:px-7 sm:pt-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[44px] leading-none tracking-[0.01em] text-[var(--text)] sm:text-[54px]">
            Calendar
          </h1>
          <p className="mt-2 font-serif text-[17px] italic text-[var(--muted)]">
            Every day, a place to return to.
          </p>
        </div>
        <button type="button" onClick={goToday} className="chip">
          Jump to today
        </button>
      </header>

      <CalendarGrid
        year={cursor.year}
        month={cursor.month}
        onPrev={() => setCursor((current) => shiftMonth(current.year, current.month, -1))}
        onNext={() => setCursor((current) => shiftMonth(current.year, current.month, 1))}
        onSelect={(date) => navigate(`/journal/${date}`)}
        entryDates={entrySet}
        photoDates={photoSet}
      />

      <div className="mt-4 flex flex-wrap items-center gap-5 px-1 text-[11.5px] text-[var(--muted)]">
        <span className="flex items-center gap-2">
          <span className="h-3.5 w-3 rounded-[1px] border border-white/25 bg-[#1a1622]" />
          A day with a photo
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
          A day with words
        </span>
        <span className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full border border-[var(--border-strong)]" />
          Today
        </span>
      </div>
    </div>
  );
}
