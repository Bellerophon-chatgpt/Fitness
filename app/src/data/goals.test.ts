import { describe, it, expect } from 'vitest';
import { mifflinBMR, weightSlopePerDay, deriveMacros, estimateMaintenance, activeGoals } from './goals';
import type { FoodItem, NutritionDay, Store, WeightEntry } from '../types';

const food = (kcal: number): FoodItem => ({
  id: 'x',
  name: 'x',
  amount: 100,
  unit: 'g',
  per100: { kcal, carbs: 0, protein: 0, fat: 0 },
});
const dayWith = (kcal: number): NutritionDay => ({ breakfast: [food(kcal)], lunch: [], dinner: [], snacks: [] });

function dstr(base: Date, offset: number): string {
  const d = new Date(base);
  d.setDate(base.getDate() + offset);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

describe('mifflinBMR', () => {
  it('matches the known formula for men and women', () => {
    // man 80kg/180cm/30y: 10*80+6.25*180-5*30+5 = 800+1125-150+5 = 1780
    expect(mifflinBMR('m', 80, 180, 30)).toBe(1780);
    // woman same stats: ... -161 = 1614
    expect(mifflinBMR('f', 80, 180, 30)).toBe(1614);
  });
});

describe('weightSlopePerDay', () => {
  it('is null with fewer than 2 points', () => {
    expect(weightSlopePerDay([])).toBeNull();
    expect(weightSlopePerDay([{ date: '2026-01-01', kg: 80 }])).toBeNull();
  });

  it('measures a steady decline (kg/day)', () => {
    const e: WeightEntry[] = [
      { date: '2026-01-01', kg: 80 },
      { date: '2026-01-08', kg: 79.3 },
      { date: '2026-01-15', kg: 78.6 },
    ];
    const slope = weightSlopePerDay(e)!;
    expect(slope).toBeCloseTo(-0.1, 5); // -1.4kg over 14 days
  });
});

describe('deriveMacros', () => {
  it('sets protein by bodyweight and fills carbs with the remainder', () => {
    const m = deriveMacros(2000, 80);
    expect(m.protein).toBe(160); // 2.0 g/kg
    expect(m.fat).toBe(60); // 27% of 2000 / 9
    expect(m.kcal).toBe(2000);
    // carbs = (2000 - 640 - 540) / 4 = 205
    expect(m.carbs).toBe(205);
  });
});

describe('estimateMaintenance', () => {
  const now = new Date(2026, 1, 1); // fixed "today"

  it('uses the formula when there is not enough logged data', () => {
    const store: Store = {
      days: {},
      profile: { sex: 'm', age: 30, heightCm: 180, activity: 'medium' },
      weightLog: [{ date: dstr(now, 0), kg: 80 }],
    };
    const est = estimateMaintenance(store, now)!;
    expect(est.basis).toBe('formula');
    expect(est.tdee).toBe(Math.round(1780 * 1.375)); // 2448
  });

  it('uses the data estimate once enough weight + intake is logged', () => {
    const weightLog: WeightEntry[] = [];
    const nutrition: Record<string, NutritionDay> = {};
    // 15 days of history: eat 2200/day, lose 0.1 kg/day (=> ~770 kcal/day deficit)
    for (let i = 14; i >= 0; i--) {
      weightLog.push({ date: dstr(now, -i), kg: 80 - (14 - i) * 0.1 });
      nutrition[dstr(now, -i)] = dayWith(2200);
    }
    const store: Store = { days: {}, weightLog, nutrition, profile: { sex: 'm', age: 30, heightCm: 180, activity: 'low' } };
    const est = estimateMaintenance(store, now)!;
    expect(est.basis).toBe('data');
    // TDEE ≈ 2200 + 0.1*7700 = 2970
    expect(est.tdee).toBeGreaterThan(2900);
    expect(est.tdee).toBeLessThan(3040);
  });

  it('returns null without profile or data', () => {
    expect(estimateMaintenance({ days: {} }, now)).toBeNull();
  });
});

describe('activeGoals', () => {
  const now = new Date(2026, 1, 1);

  it('falls back to manual goals when not adaptive', () => {
    const store: Store = { days: {}, macroGoals: { kcal: 2100, carbs: 200, protein: 150, fat: 70 } };
    const a = activeGoals(store, now);
    expect(a.basis).toBe('manual');
    expect(a.goals.kcal).toBe(2100);
  });

  it('applies the goal rate to maintenance in adaptive mode', () => {
    const store: Store = {
      days: {},
      calorieMode: 'adaptive',
      goalRate: -0.5, // -0.5 kg/week ≈ -550 kcal/day
      profile: { sex: 'm', age: 30, heightCm: 180, activity: 'medium' },
      weightLog: [{ date: dstr(now, 0), kg: 80 }],
    };
    const a = activeGoals(store, now);
    expect(a.basis).toBe('formula');
    expect(a.maintenance).toBe(2448);
    // target ≈ 2448 - 550 = ~1898
    expect(a.goals.kcal).toBeGreaterThan(1870);
    expect(a.goals.kcal).toBeLessThan(1920);
  });
});
