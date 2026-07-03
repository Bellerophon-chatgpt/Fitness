// ff-app.jsx — root: state, persistence, routing, device scaler
const { useState: useStateA, useEffect: useEffectA, useCallback } = React;

function useScale(w, h, margin = 28) {
  const [scale, setScale] = useStateA(1);
  useEffectA(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - margin) / h, (window.innerWidth - margin) / w));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [w, h, margin]);
  return scale;
}

function App() {
  const [store, setStore] = useStateA(loadStore);
  const [tab, setTab] = useStateA('training');
  const [selDay, setSelDay] = useStateA(TODAY);
  const [overlay, setOverlay] = useStateA(null); // {type:'focus'|'add', day, exIdx}
  const [toast, setToast] = useStateA(null);
  const [theme, setTheme] = useStateA(() => { try { return localStorage.getItem('ff_theme') || 'dark'; } catch (e) { return 'dark'; } });
  const scale = useScale(402, 874);

  const toggleTheme = () => setTheme(t => { const n = t === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('ff_theme', n); } catch (e) {} return n; });

  const flash = msg => { setToast(msg); setTimeout(() => setToast(t => t === msg ? null : t), 1600); };

  const update = useCallback(mut => setStore(prev => {
    const next = JSON.parse(JSON.stringify(prev));
    mut(next);
    saveStore(next);
    return next;
  }), []);

  const toggleSet = (day, ei, si) => update(n => { const s = n.days[day].ex[ei].sets[si]; s.done = !s.done; });
  const updateSet = (day, ei, si, patch) => update(n => Object.assign(n.days[day].ex[ei].sets[si], patch));
  const addExercise = (day, name) => {
    update(n => {
      if (!n.days[day]) n.days[day] = { title: 'Eigen schema', tag: 'Training', ex: [] };
      n.days[day].ex.push({ name, sets: Array.from({ length: 3 }, () => ({ reps: 10, weight: 20, done: false, last: null })) });
    });
    flash(name + ' toegevoegd');
  };
  const removeExercise = (day, ei) => update(n => {
    n.days[day].ex.splice(ei, 1);
    if (n.days[day].ex.length === 0) delete n.days[day];
  });
  const setExerciseSets = (day, ei, count) => update(n => {
    const ex = n.days[day].ex[ei];
    count = Math.max(1, Math.min(8, count));
    if (count > ex.sets.length) {
      const last = ex.sets[ex.sets.length - 1] || { reps: 10, weight: 20 };
      while (ex.sets.length < count) ex.sets.push({ reps: last.reps, weight: last.weight, done: false });
    } else ex.sets = ex.sets.slice(0, count);
  });
  const moveExercise = (day, from, to) => update(n => {
    const arr = n.days[day].ex;
    if (to < 0 || to >= arr.length || from === to) return;
    const [m] = arr.splice(from, 1);
    arr.splice(to, 0, m);
  });

  const openFocus = (day, exIdx) => setOverlay({ type: 'focus', day, exIdx });  const openAdd = day => setOverlay({ type: 'add', day });
  const navFocus = dir => setOverlay(o => {
    const exs = store.days[o.day].ex;
    return { ...o, exIdx: Math.max(0, Math.min(exs.length - 1, o.exIdx + dir)) };
  });

  // keep screen awake while a workout (focus mode) is open
  useEffectA(() => {
    const active = overlay && overlay.type === 'focus';
    if (!active || !('wakeLock' in navigator)) return;
    let lock = null, cancelled = false;
    const acquire = () => navigator.wakeLock.request('screen')
      .then(l => { if (cancelled) { try { l.release(); } catch (e) {} } else lock = l; })
      .catch(() => {});
    acquire();
    const onVis = () => { if (document.visibilityState === 'visible' && !cancelled) acquire(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { cancelled = true; document.removeEventListener('visibilitychange', onVis); if (lock) { try { lock.release(); } catch (e) {} } };
  }, [overlay]);

  let screen;
  if (tab === 'training') screen = <TrainingTab {...{ store, selDay, setSelDay, toggleSet, openFocus, openAdd }} />;
  else if (tab === 'schema') screen = <SchemaTab {...{ store, selDay, setSelDay, setExerciseSets, removeExercise, moveExercise, openAdd }} />;
  else if (tab === 'coaching') screen = <CoachingTab store={store} goDay={i => { setSelDay(i); setTab('training'); }} />;
  else screen = <DoelenTab />;

  return (
    <ThemeCtx.Provider value={{ theme, toggle: toggleTheme }}>
    <div className="stage">
      <div className="stage-scale" style={{ transform: `scale(${scale})` }}>
        <IOSDevice dark={theme === 'dark'}>
          <div className={theme === 'light' ? 't-light' : ''} style={{ position:'relative', height:'100%', display:'flex', flexDirection:'column' }}>
            <div style={{ flex:1, minHeight:0 }}>{screen}</div>
            <TabBar active={tab} onChange={setTab} />

            {overlay && overlay.type === 'focus' && store.days[overlay.day] && (
              <FocusMode store={store} day={overlay.day} exIdx={overlay.exIdx}
                updateSet={updateSet} onClose={() => setOverlay(null)} onNav={navFocus} />
            )}
            {overlay && overlay.type === 'add' && (
              <AddPicker store={store} day={overlay.day} addExercise={addExercise} onClose={() => setOverlay(null)} />
            )}
            {toast && <div className="ff-toast">{toast}</div>}
          </div>
        </IOSDevice>
      </div>
    </div>
    </ThemeCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
