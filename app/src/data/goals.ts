import type { Activity, Macros, Sex, Store, WeightEntry } from '../types';
import { dateKey, dayTotal, DEFAULT_GOALS, hasFood } from './nutrition';

// Energy in one kg of body-mass change (mix of fat/lean), the usual planning constant.
const KCAL_PER_KG = 7700;

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  low: 1.2, // little exercise / desk job
  medium: 1.375, // light exercise 1–3×/week
  high: 1.55, // moderate 3–5×/week
  veryhigh: 1.725, // hard 6–7×/week
};

// Basal metabolic rate — Mifflin–St Jeor.
export function mifflinBMR(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'm' ? base + 5 : base - 161;
}

// Least-squares weight trend (kg/day) — robust to daily noise. Null if too little data.
export function weightSlopePerDay(entries: WeightEntry[]): number | null {
  if (entries.length < 2) return null;
  const x0 = new Date(entries[0].date).getTime();
  const pts = entries.map((e) => ({ x: (new Date(e.date).getTime() - x0) / 86400000, y: e.kg }));
  const n = pts.length;
  const sx = pts.reduce((a, p) => a + p.x, 0);
  const sy = pts.reduce((a, p) => a + p.y, 0);
  const sxx = pts.reduce((a, p) => a + p.x * p.x, 0);
  const sxy = pts.reduce((a, p) => a + p.x * p.y, 0);
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  return (n * sxy - sx * sy) / denom;
}

export interface Maintenance {
  tdee: number;
  basis: 'data' | 'formula';
}

// Estimate maintenance calories: prefer the data-driven estimate (intake vs.
// weight trend), fall back to the Mifflin formula, else null.
export function estimateMaintenance(store: Store, now = new Date()): Maintenance | null {
  const weights = store.weightLog ?? [];
  const currentKg = weights.length ? weights[weights.length - 1].kg : null;

  const windowStart = new Date(now);
  windowStart.setDate(now.getDate() - 21);
  const wsKey = dateKey(windowStart);
  const wWin = weights.filter((w) => w.date >= wsKey);
  const spanDays = wWin.length >= 2
    ? (new Date(wWin[wWin.length - 1].date).getTime() - new Date(wWin[0].date).getTime()) / 86400000
    : 0;

  let intakeSum = 0;
  let intakeDays = 0;
  for (let i = 0; i < 21; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const day = store.nutrition?.[dateKey(d)];
    if (hasFood(day)) {
      intakeSum += dayTotal(day!).kcal;
      intakeDays++;
    }
  }

  const slope = weightSlopePerDay(wWin);
  if (slope !== null && spanDays >= 10 && intakeDays >= 7) {
    const avgIntake = intakeSum / intakeDays;
    const tdee = avgIntake - slope * KCAL_PER_KG;
    if (tdee > 800 && tdee < 6000) return { tdee: Math.round(tdee), basis: 'data' };
  }

  if (store.profile && currentKg) {
    const bmr = mifflinBMR(store.profile.sex, currentKg, store.profile.heightCm, store.profile.age);
    return { tdee: Math.round(bmr * ACTIVITY_FACTOR[store.profile.activity]), basis: 'formula' };
  }
  return null;
}

// Split a calorie target into macros: protein by bodyweight, fat a share of
// energy, carbs the remainder.
export function deriveMacros(kcal: number, weightKg: number | null): Macros {
  const protein = weightKg ? Math.round(2.0 * weightKg) : Math.round((kcal * 0.3) / 4);
  const fat = Math.round((kcal * 0.27) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal: Math.round(kcal), carbs, protein, fat };
}

export interface ActiveGoals {
  goals: Macros;
  maintenance: number | null;
  basis: 'data' | 'formula' | 'manual';
}

// The goals the rest of the app should use: adaptive when configured and there's
// enough info, otherwise the manual macro goals (or defaults).
export function activeGoals(store: Store, now = new Date()): ActiveGoals {
  if (store.calorieMode === 'adaptive') {
    const est = estimateMaintenance(store, now);
    if (est) {
      const rate = store.goalRate ?? 0;
      const target = est.tdee + (rate * KCAL_PER_KG) / 7;
      const weights = store.weightLog ?? [];
      const currentKg = weights.length ? weights[weights.length - 1].kg : null;
      return { goals: deriveMacros(target, currentKg), maintenance: est.tdee, basis: est.basis };
    }
  }
  return { goals: store.macroGoals ?? DEFAULT_GOALS, maintenance: null, basis: 'manual' };
}
