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

export interface Store {
  days: Days;
  // keyed by ISO date (YYYY-MM-DD)
  nutrition?: Record<string, NutritionDay>;
  macroGoals?: Macros;
}

export type OverlayState =
  | { type: 'focus'; day: number; exIdx: number }
  | { type: 'add'; day: number }
  | null;

export type Theme = 'dark' | 'light';

export type TabId = 'training' | 'voeding' | 'schema' | 'coaching' | 'doelen';
