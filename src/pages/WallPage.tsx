import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarGrid } from '../components/CalendarGrid';
import { WallPolaroid } from '../components/Polaroid';
import { CameraIcon } from '../components/Icons';
import { useData } from '../context/DataContext';
import { shiftMonth } from '../lib/date';

const TILTS = [-3, 2, -2, 3, -1.5, 2.5];

export function WallPage() {
  const navigate = useNavigate();
  const { entryDates, photoDates } = useData();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const entrySet = useMemo(() => new Set(entryDates), [entryDates]);
  const photoSet = useMemo(() => new Set(photoDates), [photoDates]);
  const sortedPhotos = useMemo(
    () => [...photoDates].sort((a, b) => b.localeCompare(a)),
    [photoDates],
  );

  return (
    <div className="animate-fade-up mx-auto w-full max-w-[1100px] px-4 pb-12 pt-6 sm:px-7 sm:pt-8">
      <header className="mb-6">
        <h1 className="font-serif text-[44px] leading-none tracking-[0.01em] text-[var(--text)] sm:text-[54px]">
          Polaroid Wall
        </h1>
        <p className="mt-2 font-serif text-[17px] italic text-[var(--muted)]">
          Moments from your journey.
        </p>
      </header>

      <CalendarGrid
        year={cursor.year}
        month={cursor.month}
        onPrev={() => setCursor((current) => shiftMonth(current.year, current.month, -1))}
        onNext={() => setCursor((current) => shiftMonth(current.year, current.month, 1))}
        onSelect={(date) => navigate(`/journal/${date}`)}
        entryDates={entrySet}
        photoDates={photoSet}
        compact
      />

      <section className="glass mt-6 rounded-2xl px-5 pb-7 pt-6 sm:px-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-[28px] leading-none text-[var(--text)]">
              Your Polaroids
            </h2>
            <p className="mt-1.5 text-[12px] text-[var(--muted)]">
              {sortedPhotos.length === 0
                ? 'No moments captured yet.'
                : `${sortedPhotos.length} ${sortedPhotos.length === 1 ? 'moment' : 'moments'} captured.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/calendar')}
            className="text-[12px] text-[var(--muted)] transition-colors hover:text-[var(--gold-strong)]"
          >
            View calendar →
          </button>
        </div>

        {sortedPhotos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <CameraIcon className="h-9 w-9 text-[var(--muted)]" />
            <p className="font-serif text-[19px] italic text-[var(--muted)]">
              Your wall is waiting for its first photograph.
            </p>
            <button
              type="button"
              className="btn-gold mt-1 !px-5 !py-2.5 text-[13px]"
              onClick={() => navigate('/')}
            >
              Add today&rsquo;s photo
            </button>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {sortedPhotos.map((date, index) => (
              <WallPolaroid
                key={date}
                date={date}
                tilt={TILTS[index % TILTS.length]}
                onOpen={() => navigate(`/journal/${date}`)}
              />
            ))}
          </div>
        )}

        <div className="mt-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[var(--border)]" />
          <p className="shrink-0 font-serif text-[15px] italic text-[var(--gold)]">
            “A little corner of your life, captured.”
          </p>
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>
      </section>
    </div>
  );
}
