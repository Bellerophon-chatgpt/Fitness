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
import { buildLiveWorkout, deriveRoutines, liveToSession, newPRs } from './data/workout';
import type { ExerciseDef, FoodItem, Macros, MealId, OverlayState, Profile, Routine, SavedMeal, SetEntry, StrengthGoal, Store, TabId, Theme } from './types';

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
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (authEnabled && !uid) { setSettled(true); return; }
    reconcileStore(storeRef.current).then((remote) => {
      if (remote) setStore(remote);
      setSettled(true);
    });
  }, [uid]);

  // one-time (after sync settles): derive named routines from the legacy weekday schema
  useEffect(() => {
    if (!settled) return;
    if (storeRef.current.routines) return;
    update((n) => {
      if (n.routines) return;
      n.routines = deriveRoutines(n.days).map((r) => ({ id: newId(), ...r }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled]);

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

  const registerExercise = (def: ExerciseDef) =>
    update((n) => {
      const k = def.name.trim().toLowerCase();
      const list = n.customExercises ?? [];
      if (!list.some((d) => d.name.trim().toLowerCase() === k)) n.customExercises = [...list, def];
    });

  const rt = (n: Store, id: string): Routine | undefined => (n.routines ?? []).find((r) => r.id === id);

  const addRoutine = (routine: Routine) =>
    update((n) => { n.routines = [...(n.routines ?? []), routine]; });

  const updateRoutineMeta = (id: string, patch: Partial<Pick<Routine, 'title' | 'tag'>>) =>
    update((n) => { const r = rt(n, id); if (r) Object.assign(r, patch); });

  const deleteRoutine = (id: string) =>
    update((n) => { n.routines = (n.routines ?? []).filter((r) => r.id !== id); });

  const addExerciseToRoutine = (id: string, name: string) => {
    update((n) => {
      const r = rt(n, id);
      if (!r) return;
      r.ex.push({ name, sets: Array.from({ length: 3 }, () => ({ reps: 10, weight: 20, done: false, last: null })) });
    });
    flash(name + ' toegevoegd');
  };

  const removeRoutineExercise = (id: string, ei: number) =>
    update((n) => { const r = rt(n, id); if (r) r.ex.splice(ei, 1); });

  const setRoutineExerciseSets = (id: string, ei: number, count: number) =>
    update((n) => {
      const r = rt(n, id);
      const ex = r?.ex[ei];
      if (!ex) return;
      count = Math.max(1, Math.min(8, count));
      if (count > ex.sets.length) {
        const last = ex.sets[ex.sets.length - 1] || { reps: 10, weight: 20 };
        while (ex.sets.length < count) ex.sets.push({ reps: last.reps, weight: last.weight, done: false, last: null });
      } else {
        ex.sets = ex.sets.slice(0, count);
      }
    });

  const moveRoutineExercise = (id: string, from: number, to: number) =>
    update((n) => {
      const r = rt(n, id);
      if (!r) return;
      if (to < 0 || to >= r.ex.length || from === to) return;
      const [m] = r.ex.splice(from, 1);
      r.ex.splice(to, 0, m);
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

  const saveMeal = (name: string, items: FoodItem[]) => {
    if (!items.length) return;
    update((n) => {
      const meal: SavedMeal = {
        id: newId(),
        name: name.trim() || 'Maaltijd',
        items: items.map((it) => ({ name: it.name, brand: it.brand, amount: it.amount, unit: it.unit, per100: it.per100, micros: it.micros, barcode: it.barcode })),
      };
      n.savedMeals = [...(n.savedMeals ?? []), meal];
    });
    flash('Maaltijd opgeslagen');
  };

  const addSavedMeal = (dk: string, meal: MealId, savedMealId: string) => {
    let added = 0;
    update((n) => {
      const sm = (n.savedMeals ?? []).find((m) => m.id === savedMealId);
      if (!sm) return;
      if (!n.nutrition) n.nutrition = {};
      if (!n.nutrition[dk]) n.nutrition[dk] = emptyDay();
      for (const it of sm.items) {
        const item: FoodItem = { ...it, id: newId() };
        n.nutrition[dk]![meal].push(item);
        n.recentFoods = pushRecent(n.recentFoods, item);
      }
      added = sm.items.length;
    });
    if (added) flash(`${added} item${added !== 1 ? 's' : ''} toegevoegd`);
  };

  const deleteSavedMeal = (id: string) =>
    update((n) => { n.savedMeals = (n.savedMeals ?? []).filter((m) => m.id !== id); });

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

  const saveGoalConfig = (c: { mode: 'manual' | 'adaptive'; macroGoals: Macros; profile?: Profile; goalRate: number }) =>
    update((n) => {
      n.calorieMode = c.mode;
      n.goalRate = c.goalRate;
      if (c.profile) n.profile = c.profile;
      if (c.mode === 'manual') n.macroGoals = c.macroGoals;
    });

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

  const importHealthWeights = (samples: { date: string; kg: number }[]) => {
    if (!samples.length) return;
    update((n) => {
      const byDate = new Map((n.weightLog ?? []).map((w) => [w.date, w.kg]));
      for (const s of samples) byDate.set(s.date, s.kg);
      n.weightLog = [...byDate.entries()].map(([date, kg]) => ({ date, kg })).sort((a, b) => (a.date < b.date ? -1 : 1));
    });
    flash(`Gewicht gesynchroniseerd (${samples.length})`);
  };

  const setWeightGoal = (kg: number) => update((n) => { n.weightGoal = kg; });
  const setStrengthGoals = (list: StrengthGoal[]) => update((n) => { n.strengthGoals = list; });

  const toggleSessionToday = () => {
    const dk = dateKey(new Date());
    update((n) => {
      const list = n.sessions ?? [];
      if (list.some((s) => s.date === dk)) {
        n.sessions = list.filter((s) => s.date !== dk);
      } else {
        const sch = n.days[TODAY];
        let sets = 0;
        if (sch) sch.ex.forEach((e) => e.sets.forEach((s) => { if (s.done) sets++; }));
        n.sessions = [...list, { date: dk, weekday: TODAY, title: sch?.title, sets }];
      }
    });
  };

  const replaceStore = (next: Store) => {
    setStore(() => {
      saveStore(next);
      if (syncEnabled) {
        if (pushTimer.current) window.clearTimeout(pushTimer.current);
        pushTimer.current = window.setTimeout(() => pushRemoteStore(next), 400);
      }
      return next;
    });
    flash('Back-up geïmporteerd');
  };

  const addWater = (dk: string, deltaMl: number) =>
    update((n) => {
      if (!n.water) n.water = {};
      n.water[dk] = Math.max(0, (n.water[dk] || 0) + deltaMl);
    });

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

  const openFocus = (exIdx: number) => setOverlay({ type: 'focus', exIdx });
  const openAdd = (routineId: string) => setOverlay({ type: 'add', routineId });
  const navFocus = (dir: 1 | -1) =>
    setOverlay((o) => {
      if (!o || o.type !== 'focus') return o;
      const exs = storeRef.current.liveWorkout?.ex ?? [];
      return { ...o, exIdx: Math.max(0, Math.min(exs.length - 1, o.exIdx + dir)) };
    });

  // --- live workout ---
  const startWorkout = (routineId: string) => {
    update((n) => {
      const routine = (n.routines ?? []).find((r) => r.id === routineId);
      if (!routine || routine.ex.length === 0) return;
      n.liveWorkout = buildLiveWorkout(routine, TODAY, n.workoutLog);
    });
  };

  const toggleLiveSet = (ei: number, si: number) =>
    update((n) => {
      const s = n.liveWorkout?.ex[ei]?.sets[si];
      if (s) s.done = !s.done;
    });

  const updateLiveSet = (ei: number, si: number, patch: Partial<SetEntry>) =>
    update((n) => {
      const s = n.liveWorkout?.ex[ei]?.sets[si];
      if (s) Object.assign(s, patch);
    });

  const finishWorkout = () => {
    let prs: string[] = [];
    let saved = false;
    update((n) => {
      if (!n.liveWorkout) return;
      const date = dateKey(new Date());
      const session = liveToSession(n.liveWorkout, date, newId());
      if (session.exercises.length > 0) {
        prs = newPRs(n.workoutLog, session);
        n.workoutLog = [...(n.workoutLog ?? []), session];
        const list = n.sessions ?? [];
        const totalSets = session.exercises.reduce((a, e) => a + e.sets.length, 0);
        n.sessions = [...list.filter((s) => s.date !== date), { date, weekday: session.weekday, title: session.title, sets: totalSets }];
        saved = true;
      }
      n.liveWorkout = undefined;
    });
    if (saved) flash(prs.length ? `Opgeslagen · PR: ${prs.join(', ')}!` : 'Training opgeslagen');
    else flash('Geen sets afgevinkt');
  };

  const discardWorkout = () => update((n) => { n.liveWorkout = undefined; });

  const addLiveSet = (ei: number) =>
    update((n) => {
      const ex = n.liveWorkout?.ex[ei];
      if (!ex || ex.sets.length >= 12) return;
      const t = ex.sets[ex.sets.length - 1] || { weight: 20, reps: 10, done: false, last: null };
      ex.sets.push({ weight: t.weight, reps: t.reps, done: false, last: t.last ?? null });
    });

  const removeLiveSet = (ei: number) =>
    update((n) => {
      const ex = n.liveWorkout?.ex[ei];
      if (!ex || ex.sets.length <= 1) return;
      ex.sets.pop();
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
  if (tab === 'training') screen = <TrainingTab store={store} openFocus={openFocus} toggleSession={toggleSessionToday} startWorkout={startWorkout} toggleLiveSet={toggleLiveSet} finishWorkout={finishWorkout} discardWorkout={discardWorkout} />;
  else if (tab === 'voeding') screen = <VoedingTab store={store} addFood={addFood} updateAmount={updateFoodAmount} removeFood={removeFood} saveGoalConfig={saveGoalConfig} copyPreviousDay={copyPreviousDay} addWater={addWater} saveMeal={saveMeal} addSavedMeal={addSavedMeal} deleteSavedMeal={deleteSavedMeal} />;
  else if (tab === 'schema') screen = <SchemaTab store={store} addRoutine={addRoutine} updateRoutineMeta={updateRoutineMeta} deleteRoutine={deleteRoutine} setExerciseSets={setRoutineExerciseSets} removeExercise={removeRoutineExercise} moveExercise={moveRoutineExercise} openAdd={openAdd} />;
  else if (tab === 'coaching') screen = <CoachingTab store={store} goDay={() => setTab('training')} />;
  else screen = <DoelenTab store={store} email={session?.user.email ?? null} onSignOut={session ? doSignOut : undefined} logWeight={logWeight} setWeightGoal={setWeightGoal} setStrengthGoals={setStrengthGoals} onImport={replaceStore} onImportWeights={importHealthWeights} />;

  return (
    <SyncCtx.Provider value={{ offline, syncEnabled: syncing }}>
      <ThemeCtx.Provider value={{ theme, toggle: toggleTheme }}>
        <div className="ff-root">
          <div style={{ flex: 1, minHeight: 0 }}>{screen}</div>
          <TabBar active={tab} onChange={setTab} />

          {overlay?.type === 'focus' && store.liveWorkout && store.liveWorkout.ex[overlay.exIdx] && (
              <FocusMode
                exs={store.liveWorkout.ex}
                exIdx={overlay.exIdx}
                workoutLog={store.workoutLog}
                updateSet={updateLiveSet}
                addSet={addLiveSet}
                removeSet={removeLiveSet}
                onClose={() => setOverlay(null)}
                onNav={navFocus}
                onFinish={() => { finishWorkout(); setOverlay(null); }}
              />
          )}
          {overlay?.type === 'add' && <AddPicker store={store} routineId={overlay.routineId} addExercise={addExerciseToRoutine} registerExercise={registerExercise} onClose={() => setOverlay(null)} />}
          {toast && <Toast message={toast} />}
        </div>
      </ThemeCtx.Provider>
    </SyncCtx.Provider>
  );
}
