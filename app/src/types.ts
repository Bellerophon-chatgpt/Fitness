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

export interface Store {
  days: Days;
}

export type OverlayState =
  | { type: 'focus'; day: number; exIdx: number }
  | { type: 'add'; day: number }
  | null;

export type Theme = 'dark' | 'light';

export type TabId = 'training' | 'schema' | 'coaching' | 'doelen';
