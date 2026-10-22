import {
  WEEKDAY_LABELS,
  formatLongDate,
  formatMonthYear,
  isTodayKey,
  monthGrid,
} from '../lib/date';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { PhotoThumb } from './Polaroid';

interface CalendarGridProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (date: string) => void;
  entryDates: Set<string>;
  photoDates: Set<string>;
  compact?: boolean;
}

export function CalendarGrid({
  year,
  month,
  onPrev,
  onNext,
  onSelect,
  entryDates,
  photoDates,
  compact = false,
}: CalendarGridProps) {
  const cells = monthGrid(year, month);

  return (
    <div className="glass rounded-2xl px-4 pb-4 pt-5 sm:px-6 sm:pb-5">
      <div className="mb-4 flex items-center justify-between px-1">
        <h2 className="font-serif text-[22px] text-[var(--text)]">{formatMonthYear(year, month)}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--panel-soft)] hover:text-[var(--text)]"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--panel-soft)] hover:text-[var(--text)]"
            aria-label="Next month"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="pb-1.5 text-center text-[10.5px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]"
          >
            {label}
          </div>
        ))}

        {cells.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} className="min-h-[60px]" />;

          const day = Number(date.slice(8, 10));
          const hasPhoto = photoDates.has(date);
          const hasEntry = entryDates.has(date);
          const today = isTodayKey(date);

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              aria-label={`Open ${formatLongDate(date)}`}
              className={`group flex min-h-[60px] flex-col items-center gap-1 rounded-lg px-0.5 py-1.5 transition-colors hover:bg-[var(--panel-soft)] ${
                compact ? 'sm:min-h-[64px]' : 'sm:min-h-[78px]'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[12.5px] ${
                  today
                    ? 'border border-[var(--border-strong)] text-[var(--gold-strong)]'
                    : 'text-[var(--text)]'
                }`}
              >
                {day}
              </span>

              {hasPhoto ? (
                <span className="overflow-hidden rounded-[2px] border border-white/20 shadow-sm">
                  <PhotoThumb date={date} className="h-7 w-6 sm:h-8 sm:w-7" />
                </span>
              ) : hasEntry ? (
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--gold)] opacity-80" />
              ) : (
                <span className="h-1.5 w-1.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
