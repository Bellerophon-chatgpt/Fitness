import type { FoodItem, Macros, MealId, NutritionDay, Nutrients, RecentFood } from '../types';

export const MEALS: [MealId, string][] = [
  ['breakfast', 'Ontbijt'],
  ['lunch', 'Lunch'],
  ['dinner', 'Diner'],
  ['snacks', 'Snacks'],
];

export const MEAL_LABEL: Record<MealId, string> = {
  breakfast: 'Ontbijt',
  lunch: 'Lunch',
  dinner: 'Diner',
  snacks: 'Snacks',
};

export const DEFAULT_GOALS: Macros = { kcal: 2200, carbs: 250, protein: 150, fat: 70 };

export const ZERO: Macros = { kcal: 0, carbs: 0, protein: 0, fat: 0 };

// A candidate food (before it's logged): macros are per 100 g/ml.
export interface FoodCandidate {
  name: string;
  brand?: string;
  per100: Macros;
  micros?: Nutrients;
  unit: 'g' | 'ml';
  defaultAmount: number;
  barcode?: string;
}

// A short starter list so manual entry / quick-add is useful out of the box.
// Values are per 100 g unless the unit says otherwise.
export const COMMON_FOODS: FoodCandidate[] = [
  { name: 'Magere kwark', brand: 'Milbona', per100: { kcal: 52, carbs: 4.6, protein: 8.5, fat: 0.5 }, unit: 'g', defaultAmount: 250 },
  { name: 'Griekse yoghurt 0%', per100: { kcal: 57, carbs: 4, protein: 10, fat: 0 }, unit: 'g', defaultAmount: 150 },
  { name: 'Ei (gekookt)', per100: { kcal: 155, carbs: 1.1, protein: 13, fat: 11 }, unit: 'g', defaultAmount: 60 },
  { name: 'Havermout', per100: { kcal: 379, carbs: 60, protein: 13, fat: 7 }, unit: 'g', defaultAmount: 60 },
  { name: 'Kipfilet (gaar)', per100: { kcal: 165, carbs: 0, protein: 31, fat: 3.6 }, unit: 'g', defaultAmount: 150 },
  { name: 'Volkoren brood', per100: { kcal: 247, carbs: 41, protein: 9, fat: 3.4 }, unit: 'g', defaultAmount: 35 },
  { name: 'Banaan', per100: { kcal: 89, carbs: 23, protein: 1.1, fat: 0.3 }, unit: 'g', defaultAmount: 120 },
  { name: 'Witte rijst (gekookt)', per100: { kcal: 130, carbs: 28, protein: 2.7, fat: 0.3 }, unit: 'g', defaultAmount: 150 },
  { name: 'Amandelen', per100: { kcal: 579, carbs: 22, protein: 21, fat: 50 }, unit: 'g', defaultAmount: 30 },
  { name: 'Pindakaas', per100: { kcal: 588, carbs: 20, protein: 25, fat: 50 }, unit: 'g', defaultAmount: 20 },
  { name: 'Halfvolle melk', per100: { kcal: 47, carbs: 4.7, protein: 3.5, fat: 1.5 }, unit: 'ml', defaultAmount: 250 },
  { name: 'Whey proteïne shake', per100: { kcal: 375, carbs: 8, protein: 75, fat: 5 }, unit: 'g', defaultAmount: 30 },
];

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function emptyDay(): NutritionDay {
  return { breakfast: [], lunch: [], dinner: [], snacks: [] };
}

// shift an ISO date key (YYYY-MM-DD) by a number of days
export function shiftKey(dk: string, deltaDays: number): string {
  const [y, m, d] = dk.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return dateKey(dt);
}

export function hasFood(day: NutritionDay | undefined): boolean {
  if (!day) return false;
  return day.breakfast.length + day.lunch.length + day.dinner.length + day.snacks.length > 0;
}

// --- recent foods ---------------------------------------------------------

function foodKey(f: { barcode?: string; name: string; brand?: string }): string {
  const bc = f.barcode?.replace(/\D/g, '');
  if (bc) return 'b:' + bc;
  return 'n:' + f.name.trim().toLowerCase() + '|' + (f.brand || '').trim().toLowerCase();
}

// Records a just-logged food at the top of the recents list (deduped, capped).
export function pushRecent(list: RecentFood[] | undefined, item: FoodItem): RecentFood[] {
  const key = foodKey(item);
  const prev = list || [];
  const existing = prev.find((r) => r.key === key);
  const entry: RecentFood = {
    key,
    name: item.name,
    brand: item.brand,
    per100: item.per100,
    micros: item.micros,
    unit: item.unit,
    defaultAmount: item.amount,
    barcode: item.barcode,
    lastUsed: Date.now(),
    count: (existing?.count || 0) + 1,
  };
  return [entry, ...prev.filter((r) => r.key !== key)].slice(0, 40);
}

export function recentToCandidate(r: RecentFood): FoodCandidate {
  return {
    name: r.name,
    brand: r.brand,
    per100: r.per100,
    micros: r.micros,
    unit: r.unit,
    defaultAmount: r.defaultAmount,
    barcode: r.barcode,
  };
}

export function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
}

const r1 = (n: number) => Math.round(n * 10) / 10;

// macros for a logged item at its current amount
export function itemMacros(it: FoodItem): Macros {
  const f = it.amount / 100;
  return {
    kcal: Math.round(it.per100.kcal * f),
    carbs: r1(it.per100.carbs * f),
    protein: r1(it.per100.protein * f),
    fat: r1(it.per100.fat * f),
  };
}

export function scale(per100: Macros, amount: number): Macros {
  const f = amount / 100;
  return {
    kcal: Math.round(per100.kcal * f),
    carbs: r1(per100.carbs * f),
    protein: r1(per100.protein * f),
    fat: r1(per100.fat * f),
  };
}

export function sumMacros(items: Macros[]): Macros {
  return items.reduce(
    (a, m) => ({
      kcal: a.kcal + m.kcal,
      carbs: r1(a.carbs + m.carbs),
      protein: r1(a.protein + m.protein),
      fat: r1(a.fat + m.fat),
    }),
    { ...ZERO },
  );
}

export function mealTotal(items: FoodItem[]): Macros {
  return sumMacros(items.map(itemMacros));
}

export function dayTotal(day: NutritionDay): Macros {
  return sumMacros([mealTotal(day.breakfast), mealTotal(day.lunch), mealTotal(day.dinner), mealTotal(day.snacks)]);
}

// extra nutrients for one logged item, scaled to its amount
export function itemMicros(it: FoodItem): Nutrients {
  const f = it.amount / 100;
  const m = it.micros;
  if (!m) return {};
  const out: Nutrients = {};
  if (m.fiber != null) out.fiber = r1(m.fiber * f);
  if (m.sugar != null) out.sugar = r1(m.sugar * f);
  if (m.satfat != null) out.satfat = r1(m.satfat * f);
  if (m.salt != null) out.salt = Math.round(m.salt * f * 100) / 100;
  return out;
}

// day totals for the extra nutrients (always returns all four keys)
export function dayMicros(day: NutritionDay): Required<Nutrients> {
  const all = [day.breakfast, day.lunch, day.dinner, day.snacks].flat();
  const t = { fiber: 0, sugar: 0, satfat: 0, salt: 0 };
  for (const it of all) {
    const m = itemMicros(it);
    t.fiber += m.fiber || 0;
    t.sugar += m.sugar || 0;
    t.satfat += m.satfat || 0;
    t.salt += m.salt || 0;
  }
  return { fiber: r1(t.fiber), sugar: r1(t.sugar), satfat: r1(t.satfat), salt: Math.round(t.salt * 100) / 100 };
}

// true if any logged food in the day carries extra-nutrient data
export function hasMicros(day: NutritionDay): boolean {
  return [day.breakfast, day.lunch, day.dinner, day.snacks].flat().some((it) => it.micros);
}

// --- Open Food Facts (free, no API key) -------------------------------------
// Reads don't require auth. Both hits and misses return HTTP 200 — the real
// success flag lives in the body as `status === 1`.

const OFF_BASE = 'https://world.openfoodfacts.org';
const FIELDS = 'code,product_name,product_name_nl,brands,nutriments,serving_quantity,quantity';

function num(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return typeof n === 'number' && isFinite(n) && n >= 0 ? n : 0;
}

interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_nl?: string;
  brands?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, unknown>;
}

function mapProduct(p: OffProduct, barcode?: string): FoodCandidate | null {
  const n = p.nutriments || {};
  let kcal = num(n['energy-kcal_100g']);
  if (!kcal && n['energy_100g']) kcal = Math.round(num(n['energy_100g']) / 4.184); // kJ → kcal fallback
  const carbs = num(n['carbohydrates_100g']);
  const protein = num(n['proteins_100g']);
  const fat = num(n['fat_100g']);
  // reject products with no usable nutrition data at all
  if (!kcal && !carbs && !protein && !fat) return null;

  const micros: Nutrients = {};
  const fiber = num(n['fiber_100g']);
  if (fiber) micros.fiber = fiber;
  const sugar = num(n['sugars_100g']);
  if (sugar) micros.sugar = sugar;
  const satfat = num(n['saturated-fat_100g']);
  if (satfat) micros.satfat = satfat;
  let salt = num(n['salt_100g']);
  if (!salt && n['sodium_100g']) salt = num(n['sodium_100g']) * 2.5; // sodium → salt
  if (salt) micros.salt = Math.round(salt * 100) / 100;
  const hasMicros = Object.keys(micros).length > 0;

  const name = (p.product_name_nl || p.product_name || '').trim() || 'Onbekend product';
  const serving = num(p.serving_quantity);
  return {
    name,
    brand: (p.brands || '').split(',')[0]?.trim() || undefined,
    per100: { kcal, carbs, protein, fat },
    micros: hasMicros ? micros : undefined,
    unit: 'g',
    defaultAmount: serving > 0 ? Math.round(serving) : 100,
    barcode: barcode || p.code,
  };
}

export type LookupResult =
  | { status: 'found'; food: FoodCandidate }
  | { status: 'notfound' }
  | { status: 'offline' };

// Local cache of barcode → product, so rescanning is instant and works offline.
const CACHE_KEY = 'ff_off_cache_v2';
const CACHE_TTL = 60 * 864e5; // ~60 days
const CACHE_MAX = 300;

interface CacheEntry { food: FoodCandidate; ts: number }

function readCacheMap(): Record<string, CacheEntry> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as Record<string, CacheEntry>;
  } catch {
    return {};
  }
}

function cacheGet(code: string): FoodCandidate | null {
  const e = readCacheMap()[code];
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL) return null;
  return e.food;
}

function cachePut(code: string, food: FoodCandidate): void {
  try {
    const m = readCacheMap();
    m[code] = { food, ts: Date.now() };
    const keys = Object.keys(m);
    if (keys.length > CACHE_MAX) {
      keys.sort((a, b) => m[a].ts - m[b].ts);
      for (const k of keys.slice(0, keys.length - CACHE_MAX)) delete m[k];
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(m));
  } catch {
    // storage full / unavailable — cache is best-effort
  }
}

export async function lookupBarcode(barcode: string): Promise<LookupResult> {
  const clean = barcode.replace(/\D/g, '');
  if (!clean) return { status: 'notfound' };

  const cached = cacheGet(clean);
  if (cached) return { status: 'found', food: cached };

  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { status: 'offline' };

  try {
    const res = await fetch(`${OFF_BASE}/api/v2/product/${clean}.json?fields=${FIELDS}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return { status: 'offline' }; // server/network hiccup — let the user retry
    const body = (await res.json()) as { status?: number; product?: OffProduct };
    if (body.status !== 1 || !body.product) return { status: 'notfound' };
    const food = mapProduct(body.product, clean);
    if (!food) return { status: 'notfound' };
    cachePut(clean, food);
    return { status: 'found', food };
  } catch {
    return { status: 'offline' };
  }
}

export async function searchFoods(query: string): Promise<FoodCandidate[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const url =
      `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(q)}` +
      `&search_simple=1&action=process&json=1&page_size=20&fields=${FIELDS}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const body = (await res.json()) as { products?: OffProduct[] };
    const out: FoodCandidate[] = [];
    for (const p of body.products || []) {
      const c = mapProduct(p);
      if (c) out.push(c);
      if (out.length >= 12) break;
    }
    return out;
  } catch {
    return [];
  }
}
