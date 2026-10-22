const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey(now: Date = new Date()): string {
  return toDateKey(now);
}

export function isDateKey(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
  );
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, amount: number): string {
  const date = fromKey(key);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

export function formatLongDate(key: string): string {
  const date = fromKey(key);
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShortDate(key: string): string {
  const date = fromKey(key);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function formatMonthYear(year: number, month: number): string {
  return `${MONTHS_LONG[month]} ${year}`;
}

export function formatFullDate(key: string): string {
  const date = fromKey(key);
  return `${date.getDate()} ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

export function isTodayKey(key: string, now: Date = new Date()): boolean {
  return key === toDateKey(now);
}

export function monthGrid(year: number, month: number): Array<string | null> {
  const firstWeekday = new Date(year, month, 1).getDay();
  const offset = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<string | null> = [];

  for (let i = 0; i < offset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toDateKey(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function writingStreak(
  dates: Iterable<string>,
  today: string = todayKey(),
): number {
  const set = new Set(dates);
  let cursor = today;
  if (!set.has(cursor)) {
    cursor = addDays(today, -1);
    if (!set.has(cursor)) return 0;
  }

  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
