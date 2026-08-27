import { useCallback, useEffect, useRef, useState } from 'react';
import { TODAY } from './data/constants';
import { isDirty, loadStore, pushRemoteStore, reconcileStore, saveStore, syncEnabled } from './data/store';
import { SyncCtx } from './data/SyncContext';
import { ThemeCtx } from './theme/ThemeContext';
import { TabBar } from './components/TabBar';
import { Toast } from './components/Toast';
import { TrainingTab } from './screens/TrainingTab';
import { FocusMode } from './screens/FocusMode';
import { SchemaTab } from './screens/SchemaTab';
import { AddPicker } from './screens/AddPicker';
import { CoachingTab } from './screens/CoachingTab';
import { DoelenTab } from './screens/DoelenTab';
import { VoedingTab } from './screens/VoedingTab';
import { dateKey, emptyDay, hasFood, newId, pushRecent, shiftKey } from './data/nutrition';
import { authEnabled, getSession, onAuthChange, signOut } from './data/auth';
import { AuthGate } from './screens/AuthGate';
import type { Session } from '@supabase/supabase-js';
import type { FoodItem, Macros, MealId, OverlayState, SetEntry, StrengthGoal, Store, TabId, Theme } from './types';

function readTheme(): Theme {
  try {
    return (localStorage.getItem('ff_theme') as Theme) || 'dark';
  } catch {
    return 'dark';
  }
}

export default function App() {
  const [store, setStore] = useState<Store>(loadStore);
  const [tab, setTab] = useState<TabId>('training');
  const [selDay, setSelDay] = useState(TODAY);
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!authEnabled);
  const [skipAuth, setSkipAuth] = useState(false);
  const storeRef = useRef(store);
  storeRef.current = store;
  const pushTimer = useRef<number | null>(null);

  // track the Supabase session (if auth is configured)
  useEffect(() => {
    if (!authEnabled) return;
    getSession().then((s) => {
      setSession(s);
      setAuthReady(true);
    });
    return onAuthChange((s) => setSession(s));
  }, []);

  // when signed in (or when running local-only), reconcile local vs. remote:
  // whichever copy was written most recently wins
  const uid = session?.user.id;
  useEffect(() => {
    if (authEnabled && !uid) return;
    reconcileStore(storeRef.current).then((remote) => {
      if (remote) setStore(remote);
    });
  }, [uid]);

  useEffect(() => {
    if (!syncEnabled) return;
    const onOnline = () => {
      setOffline(false);
      if (isDirty()) pushRemoteStore(storeRef.current);
    };
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('t-light', theme === 'light');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f4f2ec' : '#0a0a0b');
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => {
      const n: Theme = t === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('ff_theme', n);
      } catch {
        // storage unavailable — theme still applies for this session
      }
      return n;
    });

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 1600);
  };

  const update = useCallback(
    (mut: (next: Store) => void) =>
      setStore((prev) => {
        const next: Store = JSON.parse(JSON.stringify(prev));
        mut(next);
        saveStore(next);
        if (syncEnabled) {
          if (pushTimer.current) window.clearTimeout(pushTimer.current);
          pushTimer.current = window.setTimeout(() => pushRemoteStore(next), 800);
        }
        return next;
      }),
    [],
  );

  const toggleSet = (day: number, ei: number, si: number) =>
    update((n) => {
      const s = n.days[day]!.ex[ei].sets[si];
      s.done = !s.done;
    });

  const updateSet = (day: number, ei: number, si: number, patch: Partial<SetEntry>) =>
    update((n) => Object.assign(n.days[day]!.ex[ei].sets[si], patch));

  const addExercise = (day: number, name: string) => {
    update((n) => {
      if (!n.days[day]) n.days[day] = { title: 'Eigen schema', tag: 'Training', ex: [] };
      n.days[day]!.ex.push({
        name,
        sets: Array.from({ length: 3 }, () => ({ reps: 10, weight: 20, done: false, last: null })),
      });
    });
    flash(name + ' toegevoegd');
  };

  const removeExercise = (day: number, ei: number) =>
    update((n) => {
      n.days[day]!.ex.splice(ei, 1);
      if (n.days[day]!.ex.length === 0) delete n.days[day];
    });

  const setExerciseSets = (day: number, ei: number, count: number) =>
    update((n) => {
      const ex = n.days[day]!.ex[ei];
      count = Math.max(1, Math.min(8, count));
      if (count > ex.sets.length) {
        const last = ex.sets[ex.sets.length - 1] || { reps: 10, weight: 20 };
        while (ex.sets.length < count) ex.sets.push({ reps: last.reps, weight: last.weight, done: false, last: null });
      } else {
        ex.sets = ex.sets.slice(0, count);
      }
    });

  const moveExercise = (day: number, from: number, to: number) =>
    update((n) => {
      const arr = n.days[day]!.ex;
      if (to < 0 || to >= arr.length || from === to) return;
      const [m] = arr.splice(from, 1);
      arr.splice(to, 0, m);
    });

  const addFood = (dk: string, meal: MealId, item: FoodItem) => {
    update((n) => {
      if (!n.nutrition) n.nutrition = {};
      if (!n.nutrition[dk]) n.nutrition[dk] = emptyDay();
      n.nutrition[dk]![meal].push(item);
      n.recentFoods = pushRecent(n.recentFoods, item);
    });
    flash(item.name + ' toegevoegd');
  };

  const updateFoodAmount = (dk: string, meal: MealId, id: string, amount: number) =>
    update((n) => {
      const it = n.nutrition?.[dk]?.[meal].find((f) => f.id === id);
      if (it) it.amount = amount;
    });

  const removeFood = (dk: string, meal: MealId, id: string) =>
    update((n) => {
      const day = n.nutrition?.[dk];
      if (day) day[meal] = day[meal].filter((f) => f.id !== id);
    });

  const setMacroGoals = (g: Macros) => update((n) => { n.macroGoals = g; });

  const logWeight = (kg: number) => {
    const d = dateKey(new Date());
    update((n) => {
      const log = (n.weightLog || []).filter((w) => w.date !== d);
      log.push({ date: d, kg });
      log.sort((a, b) => (a.date < b.date ? -1 : 1));
      n.weightLog = log;
    });
    flash('Gewicht opgeslagen');
  };

  const setWeightGoal = (kg: number) => update((n) => { n.weightGoal = kg; });
  const setStrengthGoals = (list: StrengthGoal[]) => update((n) => { n.strengthGoals = list; });

  const copyPreviousDay = (dk: string) => {
    const prev = shiftKey(dk, -1);
    if (!hasFood(storeRef.current.nutrition?.[prev])) return;
    update((n) => {
      const src = n.nutrition?.[prev];
      if (!src) return;
      if (!n.nutrition) n.nutrition = {};
      if (!n.nutrition[dk]) n.nutrition[dk] = emptyDay();
      const dst = n.nutrition[dk]!;
      (['breakfast', 'lunch', 'dinner', 'snacks'] as MealId[]).forEach((meal) => {
        src[meal].forEach((it) => dst[meal].push({ ...it, id: newId() }));
      });
    });
    flash('Vorige dag gekopieerd');
  };

  const doSignOut = async () => {
    await signOut();
    setSession(null);
    setSkipAuth(false);
  };

  const openFocus = (day: number, exIdx: number) => setOverlay({ type: 'focus', day, exIdx });
  const openAdd = (day: number) => setOverlay({ type: 'add', day });
  const navFocus = (dir: 1 | -1) =>
    setOverlay((o) => {
      if (!o || o.type !== 'focus') return o;
      const exs = store.days[o.day]!.ex;
      return { ...o, exIdx: Math.max(0, Math.min(exs.length - 1, o.exIdx + dir)) };
    });

  // keep screen awake while a workout (focus mode) is open
  useEffect(() => {
    const active = overlay?.type === 'focus';
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = () =>
      navigator.wakeLock
        .request('screen')
        .then((l) => {
          if (cancelled) {
            try {
              l.release();
            } catch {
              // already released
            }
          } else lock = l;
        })
        .catch(() => {});
    acquire();
    const onVis = () => {
      if (document.visibilityState === 'visible' && !cancelled) acquire();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      if (lock) {
        try {
          (lock as WakeLockSentinel).release();
        } catch {
          // already released
        }
      }
    };
  }, [overlay]);

  const syncing = authEnabled && !!session;

  if (authEnabled && !authReady) {
    return (
      <div className="ff-auth">
        <div className="ff-wordmark" style={{ fontSize: 22 }}>FORM<b>&amp;</b>FUEL</div>
      </div>
    );
  }
  if (authEnabled && !session && !skipAuth) {
    return <AuthGate onSkip={() => setSkipAuth(true)} />;
  }

  let screen;
  if (tab === 'training') screen = <TrainingTab store={store} selDay={selDay} setSelDay={setSelDay} toggleSet={toggleSet} openFocus={openFocus} openAdd={openAdd} />;
  else if (tab === 'voeding') screen = <VoedingTab store={store} addFood={addFood} updateAmount={updateFoodAmount} removeFood={removeFood} setGoals={setMacroGoals} copyPreviousDay={copyPreviousDay} />;
  else if (tab === 'schema') screen = <SchemaTab store={store} selDay={selDay} setSelDay={setSelDay} setExerciseSets={setExerciseSets} removeExercise={removeExercise} moveExercise={moveExercise} openAdd={openAdd} />;
  else if (tab === 'coaching') screen = <CoachingTab store={store} goDay={(i) => { setSelDay(i); setTab('training'); }} />;
  else screen = <DoelenTab store={store} email={session?.user.email ?? null} onSignOut={session ? doSignOut : undefined} logWeight={logWeight} setWeightGoal={setWeightGoal} setStrengthGoals={setStrengthGoals} />;

  return (
    <SyncCtx.Provider value={{ offline, syncEnabled: syncing }}>
      <ThemeCtx.Provider value={{ theme, toggle: toggleTheme }}>
        <div className="ff-root">
          <div style={{ flex: 1, minHeight: 0 }}>{screen}</div>
          <TabBar active={tab} onChange={setTab} />

          {overlay?.type === 'focus' && store.days[overlay.day] && (
            <FocusMode store={store} day={overlay.day} exIdx={overlay.exIdx} updateSet={updateSet} onClose={() => setOverlay(null)} onNav={navFocus} />
          )}
          {overlay?.type === 'add' && <AddPicker store={store} day={overlay.day} addExercise={addExercise} onClose={() => setOverlay(null)} />}
          {toast && <Toast message={toast} />}
        </div>
      </ThemeCtx.Provider>
    </SyncCtx.Provider>
  );
}
