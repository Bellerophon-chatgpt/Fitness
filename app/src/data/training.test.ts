import { describe, it, expect } from 'vitest';
import { weekStart, sessionsThisMonth, weekStreak, currentWeekDots, daysSinceLastSession } from './training';
import type { SessionLog } from '../types';

const s = (date: string): SessionLog => ({ date, weekday: 0, sets: 0 });

describe('weekStart', () => {
  it('returns the Monday of the week', () => {
    // 2026-02-04 is a Wednesday → Monday is 2026-02-02
    expect(weekStart(new Date(2026, 1, 4))).toEqual(new Date(2026, 1, 2));
    // a Monday maps to itself
    expect(weekStart(new Date(2026, 1, 2))).toEqual(new Date(2026, 1, 2));
    // a Sunday maps back to the previous Monday
    expect(weekStart(new Date(2026, 1, 8))).toEqual(new Date(2026, 1, 2));
  });
});

describe('sessionsThisMonth', () => {
  it('counts only sessions in the current calendar month', () => {
    const now = new Date(2026, 1, 15);
    const sessions = [s('2026-02-01'), s('2026-02-14'), s('2026-01-31'), s('2026-03-01')];
    expect(sessionsThisMonth(sessions, now)).toBe(2);
  });

  it('is 0 for no sessions', () => {
    expect(sessionsThisMonth(undefined, new Date(2026, 1, 15))).toBe(0);
  });
});

describe('weekStreak', () => {
  const now = new Date(2026, 1, 4); // Wed 2026-02-04

  it('counts consecutive weeks including the current one', () => {
    const sessions = [s('2026-02-03'), s('2026-01-28'), s('2026-01-20')]; // this, last, week-before
    expect(weekStreak(sessions, now)).toBe(3);
  });

  it('gives grace to an empty current week', () => {
    // nothing this week, but last two weeks have sessions
    const sessions = [s('2026-01-28'), s('2026-01-21')];
    expect(weekStreak(sessions, now)).toBe(2);
  });

  it('breaks the streak on a fully empty week', () => {
    const sessions = [s('2026-02-03'), s('2026-01-19')]; // this week, then a gap week
    expect(weekStreak(sessions, now)).toBe(1);
  });

  it('is 0 with no sessions', () => {
    expect(weekStreak([], now)).toBe(0);
  });
});

describe('currentWeekDots', () => {
  it('marks the days of this week that have a session', () => {
    const now = new Date(2026, 1, 4); // week of Mon 2026-02-02
    const dots = currentWeekDots([s('2026-02-02'), s('2026-02-04')], now);
    expect(dots).toEqual([true, false, true, false, false, false, false]);
  });
});

describe('daysSinceLastSession', () => {
  it('is 0 for a session today', () => {
    const now = new Date(2026, 1, 4);
    expect(daysSinceLastSession([s('2026-02-04')], now)).toBe(0);
  });

  it('counts whole days since the most recent session', () => {
    const now = new Date(2026, 1, 4);
    expect(daysSinceLastSession([s('2026-02-01'), s('2026-01-20')], now)).toBe(3);
  });

  it('is null when never logged', () => {
    expect(daysSinceLastSession([], new Date())).toBeNull();
  });
});
