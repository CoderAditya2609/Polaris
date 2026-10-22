import type { Mood } from '../lib/types';

const MOODS: Array<{ value: Mood; label: string; mouth: string }> = [
  { value: 'heavy', label: 'Heavy', mouth: 'M8.4 16.7Q12 13.5 15.6 16.7' },
  { value: 'low', label: 'Low', mouth: 'M8.7 15.9Q12 14.1 15.3 15.9' },
  { value: 'steady', label: 'Steady', mouth: 'M8.7 15.3H15.3' },
  { value: 'good', label: 'Good', mouth: 'M8.6 14.7Q12 17.3 15.4 14.7' },
  { value: 'radiant', label: 'Radiant', mouth: 'M8.3 14.2Q12 18.6 15.7 14.2' },
];

interface MoodPickerProps {
  value: Mood | null;
  onChange: (mood: Mood | null) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-[12.5px] text-[var(--muted)]">How are you feeling today?</span>
      <div className="flex items-center gap-1.5" role="group" aria-label="Mood">
        {MOODS.map((mood) => {
          const selected = value === mood.value;
          return (
            <button
              key={mood.value}
              type="button"
              title={mood.label}
              aria-label={mood.label}
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : mood.value)}
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                selected
                  ? 'border-[var(--border-strong)] bg-[var(--gold-soft)] text-[var(--gold-strong)]'
                  : 'border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:text-[var(--text)]'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[21px] w-[21px]"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.4}
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="8.6" />
                <circle cx="9.2" cy="10" r="0.9" fill="currentColor" stroke="none" />
                <circle cx="14.8" cy="10" r="0.9" fill="currentColor" stroke="none" />
                <path d={mood.mouth} />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
