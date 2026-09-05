import { describe, it, expect } from 'vitest';
import {
  epley1RM,
  bestE1RM,
  setsVolume,
  sessionVolume,
  lastPerformance,
  bestE1RMHistory,
  buildLiveWorkout,
  liveToSession,
  newPRs,
  exerciseHistory,
} from './workout';
import type { DaySchema, LiveWorkout, WorkoutSession } from '../types';

describe('epley1RM', () => {
  it('takes a single rep at face value', () => {
    expect(epley1RM(100, 1)).toBe(100);
  });
  it('estimates for multiple reps', () => {
    expect(epley1RM(100, 10)).toBeCloseTo(133.33, 1);
  });
});

describe('volume + best', () => {
  it('sums set volume', () => {
    expect(setsVolume([{ weight: 100, reps: 5 }, { weight: 80, reps: 8 }])).toBe(1140);
  });
  it('finds the best estimated 1RM across sets', () => {
    expect(bestE1RM([{ weight: 100, reps: 5 }, { weight: 90, reps: 10 }])).toBeCloseTo(120, 0);
  });
  it('totals session volume', () => {
    expect(sessionVolume([{ name: 'a', sets: [{ weight: 50, reps: 10 }] }, { name: 'b', sets: [{ weight: 20, reps: 10 }] }])).toBe(700);
  });
});

const log: WorkoutSession[] = [
  { id: '1', date: '2026-01-01', weekday: 0, exercises: [{ name: 'Bench Press', sets: [{ weight: 60, reps: 8 }] }], volume: 480 },
  { id: '2', date: '2026-01-08', weekday: 0, exercises: [{ name: 'Bench Press', sets: [{ weight: 65, reps: 8 }] }], volume: 520 },
];

describe('lastPerformance', () => {
  it('returns the most recent performance, case-insensitive', () => {
    expect(lastPerformance(log, 'bench press')?.sets[0]).toEqual({ weight: 65, reps: 8 });
  });
  it('is null for an unseen exercise', () => {
    expect(lastPerformance(log, 'Squat')).toBeNull();
  });
});

describe('bestE1RMHistory', () => {
  it('takes the best e1RM ever for the exercise', () => {
    // 65×8 → ~82.3 beats 60×8 → ~76
    expect(bestE1RMHistory(log, 'Bench Press')).toBeCloseTo(82.33, 1);
  });
});

describe('buildLiveWorkout', () => {
  const routine: DaySchema = {
    title: 'Push',
    tag: 'A',
    ex: [{ name: 'Bench Press', sets: [
      { weight: 40, reps: 10, done: false, last: null },
      { weight: 40, reps: 10, done: false, last: null },
    ] }],
  };

  it('pre-fills from history and resets done flags', () => {
    const live = buildLiveWorkout(routine, 0, log);
    expect(live.title).toBe('Push');
    expect(live.ex[0].sets[0]).toEqual({ weight: 65, reps: 8, done: false, last: { weight: 65, reps: 8 } });
  });

  it('falls back to template values with no history', () => {
    const live = buildLiveWorkout(routine, 0, []);
    expect(live.ex[0].sets[0].weight).toBe(40);
    expect(live.ex[0].sets[0].done).toBe(false);
  });
});

describe('liveToSession', () => {
  const live: LiveWorkout = {
    startedAt: 0,
    weekday: 0,
    title: 'Push',
    ex: [
      { name: 'Bench Press', sets: [
        { weight: 70, reps: 8, done: true, last: null },
        { weight: 70, reps: 6, done: false, last: null }, // not done → excluded
      ] },
      { name: 'Skipped', sets: [{ weight: 0, reps: 0, done: false, last: null }] }, // no done sets → dropped
    ],
  };

  it('keeps only completed sets and drops empty exercises', () => {
    const s = liveToSession(live, '2026-02-01', 'x');
    expect(s.exercises).toHaveLength(1);
    expect(s.exercises[0].sets).toEqual([{ weight: 70, reps: 8 }]);
    expect(s.volume).toBe(560);
  });
});

describe('newPRs', () => {
  it('flags exercises that beat their previous best', () => {
    const session: WorkoutSession = { id: '3', date: '2026-01-15', weekday: 0, exercises: [{ name: 'Bench Press', sets: [{ weight: 70, reps: 8 }] }], volume: 560 };
    expect(newPRs(log, session)).toEqual(['Bench Press']);
  });
  it('does not flag when nothing beats history', () => {
    const session: WorkoutSession = { id: '3', date: '2026-01-15', weekday: 0, exercises: [{ name: 'Bench Press', sets: [{ weight: 50, reps: 5 }] }], volume: 250 };
    expect(newPRs(log, session)).toEqual([]);
  });
});

describe('exerciseHistory', () => {
  it('returns oldest→newest points', () => {
    const h = exerciseHistory(log, 'Bench Press');
    expect(h).toHaveLength(2);
    expect(h[0].date).toBe('2026-01-01');
    expect(h[1].topWeight).toBe(65);
  });
});
