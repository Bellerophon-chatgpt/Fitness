// ff-screens.jsx — FORM&FUEL training screen variants
// Three takes on "log fast on mobile". Exports to window.
const { useState } = React;

// ── shared icons (simple, mono-line) ─────────────────────────
const Ic = {
  training: (s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>
    </svg>
  ),
  schema: (s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 7h14M5 12h14M5 17h9"/>
    </svg>
  ),
  coaching: (s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16v11H9l-4 3v-3H4z"/>
    </svg>
  ),
  doelen: (s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>
    </svg>
  ),
  check: (s=15) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#1a1304" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12l5 5L20 6"/>
    </svg>
  ),
  chev: (s=20, c="#5a5a60") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6"/>
    </svg>
  ),
};

function FFTabBar({ active = 'training' }) {
  const tabs = [
    ['training', 'Training', Ic.training],
    ['schema', 'Schema', Ic.schema],
    ['coaching', 'Coaching', Ic.coaching],
    ['doelen', 'Doelen', Ic.doelen],
  ];
  return (
    <div className="ff-tabs">
      {tabs.map(([id, label, icon]) => (
        <div key={id} className={'ff-tab' + (id === active ? ' on' : '')}>
          {icon(22)}
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function FFTop({ date = 'MA · 31 MEI' }) {
  return (
    <div className="ff-top">
      <div className="ff-wordmark">FORM<b>&amp;</b>FUEL</div>
      <div className="ff-date">{date}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VARIANT A — Checklist: open op vandaag, tik elke set af
// ═══════════════════════════════════════════════════════════════
function VariantA() {
  const [ex, setEx] = useState([
    { name: 'Bench Press',      sets: [ {r:12,w:60,d:true}, {r:10,w:65,d:true}, {r:8,w:70,d:false} ] },
    { name: 'Incline Dumbbell', sets: [ {r:12,w:22,d:false}, {r:12,w:22,d:false}, {r:10,w:24,d:false} ] },
    { name: 'Cable Fly',        sets: [ {r:15,w:15,d:false}, {r:15,w:15,d:false}, {r:12,w:17,d:false} ] },
    { name: 'Triceps Pushdown', sets: [ {r:15,w:25,d:false}, {r:12,w:30,d:false}, {r:12,w:30,d:false} ] },
  ]);
  const toggle = (i, j) => setEx(p => p.map((e, ii) => ii !== i ? e :
    { ...e, sets: e.sets.map((s, jj) => jj !== j ? s : { ...s, d: !s.d }) }));
  const total = ex.reduce((a, e) => a + e.sets.length, 0);
  const done = ex.reduce((a, e) => a + e.sets.filter(s => s.d).length, 0);
  const exDone = e => e.sets.every(s => s.d);

  return (
    <div className="ff">
      <div className="ff-body">
        <FFTop />
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom: 10 }}>
          <div>
            <div className="ff-label">Vandaag · Duwen</div>
            <div className="ff-h1">Borst &amp; Triceps</div>
          </div>
          <div style={{ fontFamily:'var(--ff-mono)', fontSize:13, color:'var(--ff-muted)' }}>
            <b style={{ color:'var(--ff-amber)', fontSize:18 }}>{done}</b>/{total}
          </div>
        </div>
        <div className="ff-progress" style={{ marginBottom: 16 }}>
          <i style={{ width: (done/total*100)+'%' }} />
        </div>

        <div className="ff-scroll">
          {ex.map((e, i) => (
            <div key={i} className={'ff-ex' + (exDone(e) ? ' done' : '')}>
              <div className="ff-ex-head">
                <div className="ff-ex-name">{e.name}</div>
                <div className="ff-ex-meta">{e.sets.filter(s=>s.d).length}/{e.sets.length} sets</div>
              </div>
              <div className="ff-sets">
                {e.sets.map((s, j) => (
                  <div key={j} className={'ff-set' + (s.d ? ' on' : '')} onClick={() => toggle(i, j)}>
                    <div className="v">{s.w}<span style={{opacity:.6}}>kg</span></div>
                    <div className="k">{s.r} REPS</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button className="ff-btn ff-btn-ghost" style={{ marginTop: 12 }}>+ Oefening</button>
        </div>
      </div>
      <FFTabBar active="training" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VARIANT B — Focus modus: één oefening, grote steppers + rusttimer
// ═══════════════════════════════════════════════════════════════
function VariantB() {
  const [weight, setWeight] = useState(60);
  const [reps, setReps] = useState(10);
  const [setIdx, setSetIdx] = useState(1); // 0-based current set
  const [resting, setResting] = useState(false);
  const [t, setT] = useState(90);
  const totalSets = 4;

  React.useEffect(() => {
    if (!resting) return;
    if (t <= 0) { setResting(false); setT(90); return; }
    const id = setTimeout(() => setT(x => x - 1), 1000);
    return () => clearTimeout(id);
  }, [resting, t]);

  const fmt = s => `${String(Math.floor(s/60)).padStart(1,'0')}:${String(s%60).padStart(2,'0')}`;
  const finishSet = () => { setResting(true); setSetIdx(i => Math.min(i + 1, totalSets - 1)); };

  return (
    <div className="ff">
      <div className="ff-body">
        <FFTop />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 18 }}>
          <div className="ff-sublabel">Oefening 2 / 5</div>
          <div className="ff-sublabel" style={{ color:'var(--ff-amber)' }}>Focus-modus</div>
        </div>

        <div style={{ flex: 1, display:'flex', flexDirection:'column', minHeight: 0 }}>
          <div style={{ textAlign:'center', marginBottom: 6 }}>
            <div className="ff-h1" style={{ fontSize: 30 }}>Bench Press</div>
            <div style={{ marginTop: 4, fontFamily:'var(--ff-mono)', fontSize:12, color:'var(--ff-muted)' }}>
              vorige keer · 65 kg × 8
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'center', margin:'18px 0 22px' }}>
            <div className="ff-dots">
              {Array.from({length: totalSets}).map((_, i) => (
                <div key={i} className={'ff-dot' + (i < setIdx ? ' done' : i === setIdx ? ' cur' : '')} />
              ))}
            </div>
          </div>

          <div className="ff-sublabel" style={{ marginBottom: 8 }}>Gewicht</div>
          <div className="ff-stepper" style={{ marginBottom: 16 }}>
            <button className="ff-step-btn" onClick={() => setWeight(w => Math.max(0, w - 2.5))}>−</button>
            <div className="ff-step-val"><div className="n">{weight}</div><div className="u">KG</div></div>
            <button className="ff-step-btn" onClick={() => setWeight(w => w + 2.5)}>+</button>
          </div>

          <div className="ff-sublabel" style={{ marginBottom: 8 }}>Herhalingen</div>
          <div className="ff-stepper">
            <button className="ff-step-btn" onClick={() => setReps(r => Math.max(0, r - 1))}>−</button>
            <div className="ff-step-val"><div className="n">{reps}</div><div className="u">REPS</div></div>
            <button className="ff-step-btn" onClick={() => setReps(r => r + 1)}>+</button>
          </div>

          <div style={{ flex: 1 }} />
          <button className="ff-btn ff-btn-primary" onClick={finishSet}>
            Set {setIdx + 1} klaar →
          </button>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 4px 4px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--ff-muted)', fontFamily:'var(--ff-mono)', fontSize:12 }}>
              <span style={{transform:'scaleX(-1)', display:'inline-flex'}}>{Ic.chev(16,'#8a8a90')}</span> Vorige
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--ff-amber)', fontFamily:'var(--ff-mono)', fontSize:12 }}>
              Volgende oefening {Ic.chev(16,'#efa320')}
            </div>
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
      <FFTabBar active="training" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VARIANT C — Snel toevoegen via picker, geen doodlopende lege staat
// ═══════════════════════════════════════════════════════════════
function VariantC() {
  const recents = ['Bench Press', 'Squat', 'Deadlift', 'Pull-up', 'Overhead Press', 'Barbell Row', 'Lunges', 'Bicep Curl'];
  const [list, setList] = useState([]);
  const [picker, setPicker] = useState(true);
  const add = name => { setList(p => [...p, { name, sets: 3 }]); };

  return (
    <div className="ff">
      <div className="ff-body">
        <FFTop date="ZO · GEEN SCHEMA" />
        <div style={{ marginBottom: 14 }}>
          <div className="ff-label">Trainingsdag</div>
        </div>
        <div className="ff-days" style={{ marginBottom: 18 }}>
          {['MA','DI','WO','DO','VR','ZA','ZO'].map((d, i) => (
            <div key={d} className={'ff-day' + (i === 6 ? ' on' : '')}>
              {d}{[0,2,4].includes(i) && <span className="pip" />}
            </div>
          ))}
        </div>

        <div className="ff-scroll">
          {list.length === 0 && !picker && (
            <div className="ff-empty">
              Nog geen oefeningen voor zondag.
              <div style={{ marginTop: 12 }}>
                <button className="ff-btn ff-btn-primary" style={{ height: 48, fontSize: 12 }} onClick={() => setPicker(true)}>+ Oefening toevoegen</button>
              </div>
            </div>
          )}

          {list.map((e, i) => (
            <div key={i} className="ff-ex">
              <div className="ff-ex-head">
                <div className="ff-ex-name">{e.name}</div>
                <div className="ff-ex-meta">{e.sets} sets</div>
              </div>
            </div>
          ))}

          {picker && (
            <div className="ff-sheet">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
                <div className="ff-label">Snel toevoegen</div>
                <div onClick={() => setPicker(false)} style={{ fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ff-muted)', cursor:'pointer', letterSpacing:'.1em' }}>KLAAR</div>
              </div>
              <input className="ff-search" placeholder="Zoek oefening…" />
              <div className="ff-sublabel" style={{ margin:'14px 0 2px' }}>Recent gebruikt — tik om toe te voegen</div>
              <div className="ff-chips">
                {recents.map(r => (
                  <div key={r} className="ff-chip" onClick={() => add(r)}>
                    <span className="plus">+</span>{r}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!picker && (
            <button className="ff-btn ff-btn-ghost" style={{ marginTop: 12 }} onClick={() => setPicker(true)}>+ Nog een oefening</button>
          )}
        </div>
      </div>
      <FFTabBar active="training" />
    </div>
  );
}

Object.assign(window, { VariantA, VariantB, VariantC, FFTabBar, FFTop, Ic });
