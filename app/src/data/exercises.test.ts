import { describe, it, expect } from 'vitest';
import { allExercises, findDef, muscleOf, EXERCISE_LIBRARY } from './exercises';
import type { Store } from '../types';

const base: Store = { days: {} };

describe('findDef / muscleOf', () => {
  it('resolves a built-in exercise case-insensitively', () => {
    expect(findDef(base, 'bench press')?.id).toBe('bench-press');
    expect(muscleOf(base, 'Squat')).toBe('legs');
  });

  it('prefers a custom def over built-in for the same name', () => {
    const store: Store = { days: {}, customExercises: [{ id: 'c1', name: 'Squat', muscle: 'core', custom: true }] };
    expect(muscleOf(store, 'squat')).toBe('core');
  });

  it('returns other for unknown names', () => {
    expect(muscleOf(base, 'Zercher Carry')).toBe('other');
  });
});

describe('allExercises', () => {
  it('includes the whole built-in library by default', () => {
    expect(allExercises(base).length).toBe(EXERCISE_LIBRARY.length);
  });

  it('adds custom defs and dedupes by name', () => {
    const store: Store = {
      days: {},
      customExercises: [{ id: 'c1', name: 'Bench Press', muscle: 'chest', custom: true }],
    };
    // "Bench Press" already exists in library → still deduped to one entry
    const names = allExercises(store).filter((d) => d.name.toLowerCase() === 'bench press');
    expect(names).toHaveLength(1);
  });

  it('surfaces names used in routines/history that are not otherwise known', () => {
    const store: Store = {
      days: { 0: { title: 'A', tag: 'x', ex: [{ name: 'Sled Push', sets: [] }] } },
      workoutLog: [{ id: '1', date: '2026-01-01', weekday: 0, exercises: [{ name: 'Yoke Walk', sets: [{ weight: 100, reps: 5 }] }], volume: 500 }],
    };
    const names = allExercises(store).map((d) => d.name);
    expect(names).toContain('Sled Push');
    expect(names).toContain('Yoke Walk');
    expect(muscleOf(store, 'Sled Push')).toBe('other');
  });
});
