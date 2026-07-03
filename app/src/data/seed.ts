import type { Days, SetEntry } from '../types';

const mkSets = (n: number, w: number, r: number): SetEntry[] =>
  Array.from({ length: n }, () => ({ reps: r, weight: w, done: false, last: { weight: w, reps: r } }));

export const SEED: Days = {
  0: {
    title: 'Borst & Triceps', tag: 'Duwen', ex: [
      { name: 'Bench Press', sets: mkSets(3, 60, 10) },
      { name: 'Incline Dumbbell', sets: mkSets(3, 22, 12) },
      { name: 'Cable Fly', sets: mkSets(3, 15, 15) },
      { name: 'Triceps Pushdown', sets: mkSets(3, 25, 12) },
    ],
  },
  2: {
    title: 'Rug & Biceps', tag: 'Trekken', ex: [
      { name: 'Deadlift', sets: mkSets(3, 100, 5) },
      { name: 'Pull-up', sets: mkSets(3, 0, 8) },
      { name: 'Barbell Row', sets: mkSets(3, 50, 10) },
      { name: 'Bicep Curl', sets: mkSets(3, 14, 12) },
    ],
  },
  4: {
    title: 'Benen', tag: 'Onderlijf', ex: [
      { name: 'Squat', sets: mkSets(4, 80, 8) },
      { name: 'Romanian Deadlift', sets: mkSets(3, 70, 10) },
      { name: 'Leg Press', sets: mkSets(3, 140, 12) },
      { name: 'Lunges', sets: mkSets(3, 20, 12) },
    ],
  },
};
