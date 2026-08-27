import { describe, it, expect } from 'vitest';
import {
  scale,
  sumMacros,
  itemMacros,
  mealTotal,
  dayTotal,
  pushRecent,
  recentToCandidate,
  dateKey,
  shiftKey,
  hasFood,
  emptyDay,
} from './nutrition';
import type { FoodItem, NutritionDay } from '../types';

const kwark: FoodItem = {
  id: '1',
  name: 'Magere kwark',
  brand: 'Milbona',
  amount: 250,
  unit: 'g',
  per100: { kcal: 52, carbs: 4.6, protein: 8.5, fat: 0.5 },
};

describe('scale', () => {
  it('scales per-100 macros by amount', () => {
    expect(scale({ kcal: 52, carbs: 4.6, protein: 8.5, fat: 0.5 }, 250)).toEqual({
      kcal: 130,
      carbs: 11.5,
      protein: 21.3,
      fat: 1.3,
    });
  });

  it('returns zeros at amount 0', () => {
    expect(scale({ kcal: 100, carbs: 10, protein: 5, fat: 2 }, 0)).toEqual({ kcal: 0, carbs: 0, protein: 0, fat: 0 });
  });

  it('rounds kcal to a whole number and macros to one decimal', () => {
    const m = scale({ kcal: 89, carbs: 23, protein: 1.1, fat: 0.3 }, 120);
    expect(Number.isInteger(m.kcal)).toBe(true);
    expect(m.kcal).toBe(107);
    expect(m.carbs).toBe(27.6);
  });
});

describe('itemMacros', () => {
  it('uses the item amount', () => {
    expect(itemMacros(kwark)).toEqual({ kcal: 130, carbs: 11.5, protein: 21.3, fat: 1.3 });
  });
});

describe('sumMacros', () => {
  it('adds macros together', () => {
    expect(
      sumMacros([
        { kcal: 100, carbs: 10, protein: 5, fat: 2 },
        { kcal: 50, carbs: 2.5, protein: 1.5, fat: 0.5 },
      ]),
    ).toEqual({ kcal: 150, carbs: 12.5, protein: 6.5, fat: 2.5 });
  });

  it('returns zeros for an empty list', () => {
    expect(sumMacros([])).toEqual({ kcal: 0, carbs: 0, protein: 0, fat: 0 });
  });
});

describe('mealTotal / dayTotal', () => {
  it('totals a meal from its items', () => {
    const egg: FoodItem = { id: '2', name: 'Ei', amount: 100, unit: 'g', per100: { kcal: 155, carbs: 1.1, protein: 13, fat: 11 } };
    expect(mealTotal([kwark, egg])).toEqual({ kcal: 285, carbs: 12.6, protein: 34.3, fat: 12.3 });
  });

  it('totals a whole day across meals', () => {
    const day: NutritionDay = { ...emptyDay(), breakfast: [kwark], dinner: [kwark] };
    const t = dayTotal(day);
    expect(t.kcal).toBe(260);
    expect(t.protein).toBe(42.6);
  });

  it('an empty day totals to zero', () => {
    expect(dayTotal(emptyDay())).toEqual({ kcal: 0, carbs: 0, protein: 0, fat: 0 });
  });
});

describe('hasFood', () => {
  it('is false for undefined or empty days', () => {
    expect(hasFood(undefined)).toBe(false);
    expect(hasFood(emptyDay())).toBe(false);
  });

  it('is true when any meal has an item', () => {
    expect(hasFood({ ...emptyDay(), lunch: [kwark] })).toBe(true);
  });
});

describe('dateKey / shiftKey', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('shifts across month and year boundaries', () => {
    expect(shiftKey('2026-01-31', 1)).toBe('2026-02-01');
    expect(shiftKey('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftKey('2026-03-15', -7)).toBe('2026-03-08');
  });
});

describe('pushRecent', () => {
  it('adds a new food to the front with count 1 and the logged amount', () => {
    const list = pushRecent(undefined, kwark);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Magere kwark');
    expect(list[0].count).toBe(1);
    expect(list[0].defaultAmount).toBe(250);
  });

  it('dedupes by barcode and bumps the count', () => {
    const withBc: FoodItem = { ...kwark, barcode: '5410188031072' };
    const again: FoodItem = { ...withBc, amount: 300 };
    let list = pushRecent(undefined, withBc);
    list = pushRecent(list, again);
    expect(list).toHaveLength(1);
    expect(list[0].count).toBe(2);
    expect(list[0].defaultAmount).toBe(300);
  });

  it('moves a re-logged food back to the front', () => {
    const a: FoodItem = { id: 'a', name: 'A', amount: 100, unit: 'g', per100: { kcal: 1, carbs: 0, protein: 0, fat: 0 } };
    const b: FoodItem = { id: 'b', name: 'B', amount: 100, unit: 'g', per100: { kcal: 1, carbs: 0, protein: 0, fat: 0 } };
    let list = pushRecent(pushRecent(undefined, a), b);
    expect(list[0].name).toBe('B');
    list = pushRecent(list, a);
    expect(list[0].name).toBe('A');
    expect(list).toHaveLength(2);
  });

  it('caps the list at 40 entries', () => {
    let list = pushRecent(undefined, { ...kwark, name: 'seed' });
    for (let i = 0; i < 60; i++) {
      list = pushRecent(list, { ...kwark, name: 'food-' + i });
    }
    expect(list.length).toBe(40);
  });
});

describe('recentToCandidate', () => {
  it('maps a recent food back to a pickable candidate', () => {
    const list = pushRecent(undefined, kwark);
    const c = recentToCandidate(list[0]);
    expect(c).toEqual({
      name: 'Magere kwark',
      brand: 'Milbona',
      per100: { kcal: 52, carbs: 4.6, protein: 8.5, fat: 0.5 },
      unit: 'g',
      defaultAmount: 250,
      barcode: undefined,
    });
  });
});
