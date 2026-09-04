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

// A completed training session, stamped with its actual date.
export interface SessionLog {
  date: string; // YYYY-MM-DD
  weekday: number; // 0-6 (Mon=0)
  title?: string;
  sets: number; // sets completed that session
}

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
  micros?: Nutrients; // extra nutrients per 100 g/ml (from Open Food Facts)
  barcode?: string;
}

// Extra nutrients per 100 g/ml, all optional (data isn't always available).
export interface Nutrients {
  fiber?: number;
  sugar?: number;
  satfat?: number;
  salt?: number;
}

export type NutritionDay = Record<MealId, FoodItem[]>;

// A food the user has logged before, kept for quick re-adding.
export interface RecentFood {
  key: string; // dedupe key (barcode, or name+brand)
  name: string;
  brand?: string;
  per100: Macros;
  micros?: Nutrients;
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

// Profile used for the formula-based calorie estimate (Mifflin–St Jeor).
export type Sex = 'm' | 'f';
export type Activity = 'low' | 'medium' | 'high' | 'veryhigh';

export interface Profile {
  sex: Sex;
  age: number;
  heightCm: number;
  activity: Activity;
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
  // adaptive calorie goals
  calorieMode?: 'manual' | 'adaptive';
  profile?: Profile;
  goalRate?: number; // kg per week, signed (− lose, + gain, 0 maintain)
  sessions?: SessionLog[];
  water?: Record<string, number>; // date (YYYY-MM-DD) → ml
}

export type OverlayState =
  | { type: 'focus'; day: number; exIdx: number }
  | { type: 'add'; day: number }
  | null;

export type Theme = 'dark' | 'light';

export type TabId = 'training' | 'voeding' | 'schema' | 'coaching' | 'doelen';
