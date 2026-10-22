import { describe, expect, it } from 'vitest';
import {
  addDays,
  formatLongDate,
  formatMonthYear,
  formatShortDate,
  fromKey,
  isDateKey,
  isTodayKey,
  monthGrid,
  shiftMonth,
  toDateKey,
  todayKey,
  writingStreak,
} from '../lib/date';

describe('date keys', () => {
  it('uses local calendar dates without timezone drift', () => {
    expect(toDateKey(new Date(2026, 9, 22, 23, 59))).toBe('2026-10-22');
    expect(toDateKey(new Date(2026, 0, 1, 0, 1))).toBe('2026-01-01');
  });

  it('round-trips keys through Date', () => {
    expect(toDateKey(fromKey('2026-10-22'))).toBe('2026-10-22');
  });

  it('validates date keys', () => {
    expect(isDateKey('2026-10-22')).toBe(true);
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(isDateKey('22-10-2026')).toBe(false);
    expect(isDateKey(undefined)).toBe(false);
  });

  it('recognises today', () => {
    expect(isTodayKey(todayKey())).toBe(true);
    expect(isTodayKey('1999-01-01')).toBe(false);
  });
});

describe('formatting', () => {
  it('formats the long date like the reference', () => {
    expect(formatLongDate('2026-10-22')).toBe('Thu, 22 Oct 2026');
    expect(formatLongDate('2025-10-22')).toBe('Wed, 22 Oct 2025');
  });

  it('formats short dates for polaroid captions', () => {
    expect(formatShortDate('2026-10-22')).toBe('22 Oct');
    expect(formatShortDate('2026-01-03')).toBe('3 Jan');
  });

  it('formats month headings', () => {
    expect(formatMonthYear(2026, 9)).toBe('October 2026');
    expect(formatMonthYear(2025, 0)).toBe('January 2025');
  });
});

describe('calendar maths', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('builds a Monday-first grid for October 2026', () => {
    const grid = monthGrid(2026, 9);
    expect(grid.length % 7).toBe(0);
    expect(grid.length).toBe(35);
    expect(grid.slice(0, 3)).toEqual([null, null, null]);
    expect(grid[3]).toBe('2026-10-01');
    expect(grid).toContain('2026-10-31');
    expect(grid.filter(Boolean)).toHaveLength(31);
  });

  it('shifts months across years', () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth(2026, 9, 0)).toEqual({ year: 2026, month: 9 });
  });
});

describe('writing streak', () => {
  it('counts consecutive days ending today', () => {
    const dates = ['2026-10-20', '2026-10-21', '2026-10-22'];
    expect(writingStreak(dates, '2026-10-22')).toBe(3);
  });

  it('still counts a streak that ended yesterday', () => {
    const dates = ['2026-10-20', '2026-10-21'];
    expect(writingStreak(dates, '2026-10-22')).toBe(2);
  });

  it('stops at a gap and ignores unrelated dates', () => {
    const dates = ['2026-10-18', '2026-10-20', '2026-10-21', '2026-10-22'];
    expect(writingStreak(dates, '2026-10-22')).toBe(3);
    expect(writingStreak(['2026-09-01'], '2026-10-22')).toBe(0);
  });
});
