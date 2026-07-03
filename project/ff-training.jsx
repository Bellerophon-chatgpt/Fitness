// ff-training.jsx — Training tab (overview) + Focus mode overlay
const { useState: useStateT, useEffect: useEffectT, useRef: useRefT } = React;

// tappable, typeable number field (works alongside the +/- steppers)
function EditNum({ value, unit, round, onCommit }) {
  const [editing, setEditing] = useStateT(false);
  const [txt, setTxt] = useStateT(String(value));
  useEffectT(() => { if (!editing) setTxt(String(value)); }, [value, editing]);
  const commit = () => {
    setEditing(false);
    let v = parseFloat(String(txt).replace(',', '.'));
    if (!isNaN(v)) { v = Math.max(0, v); onCommit(round ? Math.round(v) : v); }
  };
  return (
    <div className="ff-step-val">
      <input className="ff-numinput" inputMode="decimal" value={txt}
        onFocus={e => { setEditing(true); setTimeout(() => e.target.select(), 0); }}
        onChange={e => setTxt(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }} />
      <div className="u">{unit}</div>
    </div>
  );
}

function TrainingTab({ store, selDay, setSelDay, toggleSet, openFocus, openAdd }) {
  const day = store.days[selDay];
  const dots = daysWithEx(store);

  let done = 0, total = 0;
  if (day) day.ex.forEach(e => e.sets.forEach(s => { total++; if (s.d || s.done) done++; }));

  return (
    <div className="ff">
      <div className="ff-body">
        <Top />
        <div style={{ marginBottom: 12 }}>
          <DayStrip sel={selDay} onSel={setSelDay} dotDays={dots} />
        </div>

        {!day ? (
          <div className="ff-scroll">
            <div style={{ marginBottom: 14 }}>
              <div className="ff-label">{DAYS_LONG[selDay]}</div>
              <div className="ff-h1">Rustdag</div>
            </div>
            <div className="ff-empty">
              Geen oefeningen voor {DAYS_LONG[selDay].toLowerCase()}.
              <div style={{ marginTop: 14 }}>
                <button className="ff-btn ff-btn-primary" style={{ height: 48, fontSize: 12 }} onClick={() => openAdd(selDay)}>+ Oefening toevoegen</button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom: 10 }}>
              <div>
                <div className="ff-label">{selDay === TODAY ? 'Vandaag' : DAYS_LONG[selDay]} · {day.tag}</div>
                <div className="ff-h1">{day.title}</div>
              </div>
              <div style={{ fontFamily:'var(--ff-mono)', fontSize:13, color:'var(--ff-muted)' }}>
                <b style={{ color:'var(--ff-amber)', fontSize:18 }}>{done}</b>/{total}
              </div>
            </div>
            <div className="ff-progress" style={{ marginBottom: 16 }}>
              <i style={{ width: total ? (done/total*100)+'%' : '0%' }} />
            </div>

            <div className="ff-scroll">
              {day.ex.map((e, i) => {
                const exDone = e.sets.every(s => s.d || s.done);
                const sd = e.sets.filter(s => s.d || s.done).length;
                return (
                  <div key={i} className={'ff-ex' + (exDone ? ' done' : '')} onClick={() => openFocus(selDay, i)}>
                    <div className="ff-ex-head">
                      <div className="ff-ex-name">
                        {exDone && <span style={{ color:'var(--ff-amber)', display:'inline-flex' }}>{Ic.check(14)}</span>}
                        {e.name}
                      </div>
                      <div className="ff-ex-meta">{sd}/{e.sets.length} sets {Ic.chev(15)}</div>
                    </div>
                    <div className="ff-sets" onClick={ev => ev.stopPropagation()}>
                      {e.sets.map((s, j) => (
                        <div key={j} className={'ff-set' + ((s.d || s.done) ? ' on' : '')} onClick={() => toggleSet(selDay, i, j)}>
                          <div className="v">{s.weight}<span>kg</span></div>
                          <div className="k">{s.reps} REPS</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <button className="ff-btn ff-btn-ghost" style={{ marginTop: 12 }} onClick={() => openAdd(selDay)}>+ Oefening</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Focus mode: one exercise, big steppers, rest timer ───────
function FocusMode({ store, day, exIdx, updateSet, onClose, onNav }) {
  const exs = store.days[day].ex;
  const ex = exs[exIdx];
  const [resting, setResting] = useStateT(false);
  const [t, setT] = useStateT(90);

  useEffectT(() => {
    if (!resting) return;
    if (t <= 0) { ping(); buzz(); setResting(false); setT(90); return; }
    const id = setTimeout(() => setT(x => x - 1), 1000);
    return () => clearTimeout(id);
  }, [resting, t]);

  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const cur = ex.sets.findIndex(s => !s.done);
  const allDone = cur === -1;
  const idx = allDone ? ex.sets.length - 1 : cur;
  const setObj = ex.sets[idx];

  const bump = (field, delta, min=0) => updateSet(day, exIdx, idx, { [field]: Math.max(min, Math.round((setObj[field] + delta) * 10) / 10) });
  const finishSet = () => { updateSet(day, exIdx, cur, { done: true }); if (cur < ex.sets.length - 1) { setT(90); setResting(true); } };
  const hasNext = exIdx < exs.length - 1;

  return (
    <div className="ff-overlay">
      <div className="ff-ohead">
        <button className="ff-x" onClick={onClose}>{Ic.close(18)}</button>
        <div className="ff-sublabel">Oefening {exIdx + 1} / {exs.length}</div>
        <div className="ff-x" style={{ borderColor:'transparent', background:'transparent' }} />
      </div>

      <div className="ff-obody">
        <div style={{ textAlign:'center', marginBottom: 6 }}>
          <div className="ff-h1" style={{ fontSize: 30 }}>{ex.name}</div>
          <div style={{ marginTop: 7, fontFamily:'var(--ff-mono)', fontSize: 12, color:'var(--ff-muted)', letterSpacing:'.02em' }}>
            {setObj.last
              ? <>vorige keer · <b style={{ color:'var(--ff-text)' }}>{setObj.last.weight} kg × {setObj.last.reps}</b></>
              : 'nieuwe oefening'}
          </div>
          <div style={{ marginTop: 9, display:'flex', justifyContent:'center' }}>
            <div className="ff-dots">
              {ex.sets.map((s, i) => <div key={i} className={'ff-dot' + (s.done ? ' done' : i === cur ? ' cur' : '')} />)}
            </div>
          </div>
        </div>

        {allDone ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 14 }}>
            <div style={{ width:64, height:64, borderRadius:99, background:'var(--ff-amber)', display:'flex', alignItems:'center', justifyContent:'center' }}>{Ic.check(30)}</div>
            <div style={{ fontFamily:'var(--ff-mono)', fontSize:13, letterSpacing:'.1em', color:'var(--ff-muted)' }}>ALLE SETS KLAAR</div>
          </div>
        ) : (
          <div style={{ marginTop: 18 }}>
            <div className="ff-sublabel" style={{ marginBottom: 8 }}>Gewicht · set {idx + 1}</div>
            <div className="ff-stepper" style={{ marginBottom: 16 }}>
              <button className="ff-step-btn" onClick={() => bump('weight', -2.5)}>−</button>
              <EditNum value={setObj.weight} unit="KG" onCommit={v => updateSet(day, exIdx, idx, { weight: v })} />
              <button className="ff-step-btn" onClick={() => bump('weight', 2.5)}>+</button>
            </div>
            <div className="ff-sublabel" style={{ marginBottom: 8 }}>Herhalingen</div>
            <div className="ff-stepper">
              <button className="ff-step-btn" onClick={() => bump('reps', -1)}>−</button>
              <EditNum value={setObj.reps} unit="REPS" round onCommit={v => updateSet(day, exIdx, idx, { reps: v })} />
              <button className="ff-step-btn" onClick={() => bump('reps', 1)}>+</button>
            </div>
            <div style={{ marginTop: 12, textAlign:'center', fontFamily:'var(--ff-mono)', fontSize: 11, color:'var(--ff-faint)', letterSpacing:'.04em' }}>
              tik het getal om te typen
            </div>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 16 }} />

        {allDone ? (
          <button className="ff-btn ff-btn-primary" onClick={() => hasNext ? onNav(1) : onClose()}>
            {hasNext ? 'Volgende oefening →' : 'Training afronden ✓'}
          </button>
        ) : (
          <button className="ff-btn ff-btn-primary" onClick={finishSet}>Set {idx + 1} klaar →</button>
        )}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 2px 6px' }}>
          <div onClick={() => exIdx > 0 && onNav(-1)} style={{ display:'flex', alignItems:'center', gap:6, color: exIdx>0?'var(--ff-muted)':'var(--ff-faint)', fontFamily:'var(--ff-mono)', fontSize:12, cursor: exIdx>0?'pointer':'default' }}>
            <span style={{ transform:'scaleX(-1)', display:'inline-flex' }}>{Ic.chev(16, exIdx>0?'#8a8a90':'#3a3a3e')}</span> Vorige
          </div>
          <div onClick={() => hasNext && onNav(1)} style={{ display:'flex', alignItems:'center', gap:6, color: hasNext?'var(--ff-amber)':'var(--ff-faint)', fontFamily:'var(--ff-mono)', fontSize:12, cursor: hasNext?'pointer':'default' }}>
            Volgende {Ic.chev(16, hasNext?'#efa320':'#3a3a3e')}
          </div>
        </div>
      </div>

      {resting && (
        <div className="ff-rest">
          <div className="ff-sublabel" style={{ color:'var(--ff-amber)' }}>Rust</div>
          <div className="num">{fmt(t)}</div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="ff-btn ff-btn-ghost" style={{ width:130 }} onClick={() => setT(x => x + 30)}>+30 sec</button>
            <button className="ff-btn ff-btn-primary" style={{ width:130, height:50, fontSize:12 }} onClick={() => { setResting(false); setT(90); }}>Sla over</button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { TrainingTab, FocusMode });
