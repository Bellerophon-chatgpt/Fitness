import type { SessionLog } from '../types';

function ymd(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// Monday 00:00 of the week containing d.
export function weekStart(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const wd = (r.getDay() + 6) % 7; // Mon=0
  r.setDate(r.getDate() - wd);
  return r;
}

export function sessionsThisMonth(sessions: SessionLog[] | undefined, now = new Date()): number {
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return (sessions ?? []).filter((s) => s.date.startsWith(prefix)).length;
}

// Number of consecutive weeks (ending at the current week) that have ≥1 session.
// The current week is given grace: if it's empty but last week has a session,
// the streak still counts from last week rather than resetting to 0.
export function weekStreak(sessions: SessionLog[] | undefined, now = new Date()): number {
  const dates = new Set((sessions ?? []).map((s) => s.date));
  const hasInWeek = (start: Date) => {
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (dates.has(ymd(d))) return true;
    }
    return false;
  };

  const cur = weekStart(now);
  let streak = 0;
  let cursor = new Date(cur);
  // grace for the in-progress current week
  if (!hasInWeek(cursor)) cursor.setDate(cursor.getDate() - 7);
  while (hasInWeek(cursor)) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

// Which days of the current week (Mon..Sun) have a logged session.
export function currentWeekDots(sessions: SessionLog[] | undefined, now = new Date()): boolean[] {
  const dates = new Set((sessions ?? []).map((s) => s.date));
  const start = weekStart(now);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return dates.has(ymd(d));
  });
}

// Whole days since the most recent session (0 = today). Null if never logged.
export function daysSinceLastSession(sessions: SessionLog[] | undefined, now = new Date()): number | null {
  if (!sessions || sessions.length === 0) return null;
  const latest = sessions.reduce((a, s) => (s.date > a ? s.date : a), sessions[0].date);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = latest.split('-').map(Number);
  const last = new Date(y, m - 1, d);
  return Math.round((today.getTime() - last.getTime()) / 86400000);
}
