import type { Store } from '../types';
import { SEED } from './seed';
import { supabase } from './supabase';

const FF_KEY = 'ff_proto_v3';
const FF_META_KEY = 'ff_proto_v3_meta';
const ROW_ID = 'main';

interface Meta {
  updatedAt: string;
  dirty: boolean;
}

function loadMeta(): Meta {
  try {
    const raw = localStorage.getItem(FF_META_KEY);
    if (raw) return JSON.parse(raw) as Meta;
  } catch {
    // ignore corrupt storage
  }
  return { updatedAt: new Date(0).toISOString(), dirty: false };
}

function saveMeta(m: Meta) {
  try {
    localStorage.setItem(FF_META_KEY, JSON.stringify(m));
  } catch {
    // storage unavailable
  }
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(FF_KEY);
    const parsed = raw ? (JSON.parse(raw) as Store) : null;
    if (parsed && parsed.days) return parsed;
  } catch {
    // ignore corrupt storage
  }
  return { days: JSON.parse(JSON.stringify(SEED)) };
}

export function saveStore(s: Store) {
  try {
    localStorage.setItem(FF_KEY, JSON.stringify(s));
  } catch {
    // storage unavailable (e.g. private mode) — state stays in memory only
  }
  saveMeta({ updatedAt: new Date().toISOString(), dirty: true });
}

// --- Cross-device sync (optional: no-op when Supabase isn't configured) ---

export const syncEnabled = !!supabase;

export async function fetchRemoteStore(): Promise<{ store: Store; updatedAt: string } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('training_store').select('data, updated_at').eq('id', ROW_ID).maybeSingle();
  if (error || !data) return null;
  return { store: data.data as Store, updatedAt: data.updated_at as string };
}

export async function pushRemoteStore(s: Store): Promise<boolean> {
  if (!supabase) return false;
  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from('training_store').upsert({ id: ROW_ID, data: s, updated_at: updatedAt });
  if (error) return false;
  saveMeta({ updatedAt, dirty: false });
  return true;
}

// Reconcile local and remote copies on startup: whichever was written to more
// recently wins, and the other side is brought up to date.
export async function reconcileStore(local: Store): Promise<Store | null> {
  const remote = await fetchRemoteStore();
  const meta = loadMeta();
  if (!remote) {
    if (syncEnabled) await pushRemoteStore(local);
    return null;
  }
  if (remote.updatedAt > meta.updatedAt) {
    localStorage.setItem(FF_KEY, JSON.stringify(remote.store));
    saveMeta({ updatedAt: remote.updatedAt, dirty: false });
    return remote.store;
  }
  if (meta.dirty) await pushRemoteStore(local);
  return null;
}

export function isDirty(): boolean {
  return loadMeta().dirty;
}

export function daysWithEx(store: Store): Set<number> {
  return new Set(
    Object.keys(store.days)
      .filter((k) => store.days[Number(k)]?.ex.length)
      .map(Number),
  );
}
