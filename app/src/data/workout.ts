import type { Days, DaySchema, Exercise, LiveWorkout, LoggedExercise, Muscle, SetEntry, WorkoutSession } from '../types';

const norm = (s: string) => s.trim().toLowerCase();

// Estimated 1RM (Epley). A single rep is taken at face value.
export function epley1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return weight * (1 + reps / 30);
}

export function bestE1RM(sets: { weight: number; reps: number }[]): number {
  return sets.reduce((m, s) => Math.max(m, epley1RM(s.weight, s.reps)), 0);
}

export function setsVolume(sets: { weight: number; reps: number }[]): number {
  return sets.reduce((v, s) => v + s.weight * s.reps, 0);
}

export function sessionVolume(exercises: LoggedExercise[]): number {
  return exercises.reduce((v, e) => v + setsVolume(e.sets), 0);
}

// Most recent logged performance of an exercise (by name), or null.
export function lastPerformance(log: WorkoutSession[] | undefined, name: string): LoggedExercise | null {
  if (!log) return null;
  const key = norm(name);
  for (let i = log.length - 1; i >= 0; i--) {
    const ex = log[i].exercises.find((e) => norm(e.name) === key);
    if (ex && ex.sets.length) return ex;
  }
  return null;
}

// Best estimated 1RM ever recorded for an exercise.
export function bestE1RMHistory(log: WorkoutSession[] | undefined, name: string): number {
  if (!log) return 0;
  const key = norm(name);
  let best = 0;
  for (const s of log) {
    const ex = s.exercises.find((e) => norm(e.name) === key);
    if (ex) best = Math.max(best, bestE1RM(ex.sets));
  }
  return best;
}

// Build a fresh live session from a routine, pre-filled from history where possible.
export function buildLiveWorkout(routine: DaySchema, weekday: number, log?: WorkoutSession[]): LiveWorkout {
  const ex: Exercise[] = routine.ex.map((te) => {
    const prev = lastPerformance(log, te.name);
    const sets: SetEntry[] = te.sets.map((ts, i) => {
      const p = prev?.sets[i];
      const w = p ? p.weight : ts.weight;
      const r = p ? p.reps : ts.reps;
      return { weight: w, reps: r, done: false, last: p ? { weight: p.weight, reps: p.reps } : ts.last ?? null };
    });
    return { name: te.name, sets };
  });
  return { startedAt: Date.now(), weekday, title: routine.title, tag: routine.tag, ex };
}

// Convert a finished live session into a stored record (completed sets only).
export function liveToSession(live: LiveWorkout, date: string, id: string): WorkoutSession {
  const exercises: LoggedExercise[] = live.ex
    .map((e) => ({ name: e.name, sets: e.sets.filter((s) => s.done).map((s) => ({ weight: s.weight, reps: s.reps })) }))
    .filter((e) => e.sets.length > 0);
  return { id, date, weekday: live.weekday, title: live.title, exercises, volume: sessionVolume(exercises) };
}

// Exercises in a finished session that beat their previous best e1RM (PRs).
export function newPRs(log: WorkoutSession[] | undefined, session: WorkoutSession): string[] {
  const prs: string[] = [];
  for (const ex of session.exercises) {
    const prevBest = bestE1RMHistory(log, ex.name);
    if (bestE1RM(ex.sets) > prevBest + 0.01) prs.push(ex.name);
  }
  return prs;
}

// History points for one exercise, oldest → newest (for progression charts).
export interface ExercisePoint {
  date: string;
  e1rm: number;
  volume: number;
  topWeight: number;
}
export function exerciseHistory(log: WorkoutSession[] | undefined, name: string): ExercisePoint[] {
  if (!log) return [];
  const key = norm(name);
  const pts: ExercisePoint[] = [];
  for (const s of log) {
    const ex = s.exercises.find((e) => norm(e.name) === key);
    if (ex && ex.sets.length) {
      pts.push({
        date: s.date,
        e1rm: Math.round(bestE1RM(ex.sets)),
        volume: setsVolume(ex.sets),
        topWeight: Math.max(...ex.sets.map((x) => x.weight)),
      });
    }
  }
  return pts;
}

// Convert the legacy weekday schema into named routines (without ids — the
// caller assigns those). One routine per non-empty weekday, in weekday order.
export function deriveRoutines(days: Days): { title: string; tag: string; ex: Exercise[] }[] {
  const out: { title: string; tag: string; ex: Exercise[] }[] = [];
  for (let wd = 0; wd < 7; wd++) {
    const d = days[wd];
    if (d && d.ex.length) out.push({ title: d.title, tag: d.tag, ex: d.ex });
  }
  return out;
}

// Total training volume per muscle group across sessions in a date window
// (inclusive of fromKey; toKey optional). `resolve` maps an exercise name to a
// muscle, kept as a parameter so this stays pure/testable.
export function muscleVolume(
  log: WorkoutSession[] | undefined,
  resolve: (name: string) => Muscle,
  fromKey: string,
  toKey?: string,
): Record<Muscle, number> {
  const out: Record<Muscle, number> = { chest: 0, back: 0, legs: 0, shoulders: 0, arms: 0, core: 0, other: 0 };
  for (const s of log ?? []) {
    if (s.date < fromKey) continue;
    if (toKey && s.date > toKey) continue;
    for (const e of s.exercises) out[resolve(e.name)] += setsVolume(e.sets);
  }
  return out;
}
