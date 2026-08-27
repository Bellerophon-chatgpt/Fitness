export interface SetEntry {
  weight: number;
  reps: number;
  done: boolean;
  last: { weight: number; reps: number } | null;
}

export interface Exercise {
  name: string;
  sets: SetEntry[];
}

export interface DaySchema {
  title: string;
  tag: string;
  ex: Exercise[];
}

export type Days = Partial<Record<number, DaySchema>>;

// --- Nutrition / macro tracking ---

export type MealId = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface Macros {
  kcal: number;
  carbs: number; // grams
  protein: number; // grams
  fat: number; // grams
}

// A logged food. Macros are stored per 100 g/ml so the entry rescales
// automatically when the amount is edited.
export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  amount: number; // in grams or ml
  unit: 'g' | 'ml';
  per100: Macros;
  barcode?: string;
}

export type NutritionDay = Record<MealId, FoodItem[]>;

// A food the user has logged before, kept for quick re-adding.
export interface RecentFood {
  key: string; // dedupe key (barcode, or name+brand)
  name: string;
  brand?: string;
  per100: Macros;
  unit: 'g' | 'ml';
  defaultAmount: number; // the amount last logged
  barcode?: string;
  lastUsed: number; // epoch ms
  count: number;
}

// A dated bodyweight measurement (one kept per day).
export interface WeightEntry {
  date: string; // YYYY-MM-DD
  kg: number;
}

// A user-defined strength target (e.g. a 1RM to work toward).
export interface StrengthGoal {
  id: string;
  name: string;
  cur: number;
  target: number;
  unit: string;
}

export interface Store {
  days: Days;
  // keyed by ISO date (YYYY-MM-DD)
  nutrition?: Record<string, NutritionDay>;
  macroGoals?: Macros;
  recentFoods?: RecentFood[];
  weightLog?: WeightEntry[];
  weightGoal?: number;
  strengthGoals?: StrengthGoal[];
}

export type OverlayState =
  | { type: 'focus'; day: number; exIdx: number }
  | { type: 'add'; day: number }
  | null;

export type Theme = 'dark' | 'light';

export type TabId = 'training' | 'voeding' | 'schema' | 'coaching' | 'doelen';
