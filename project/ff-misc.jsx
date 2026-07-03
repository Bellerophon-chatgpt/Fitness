// ff-misc.jsx — Coaching (week overview) + Doelen tabs
function CoachingTab({ store, goDay }) {
  const sessions = [];
  let totalSets = 0;
  for (let i = 0; i < 7; i++) {
    const d = store.days[i];
    if (d && d.ex.length) {
      const sets = d.ex.reduce((a, e) => a + e.sets.length, 0);
      totalSets += sets;
      sessions.push({ i, title: d.title, tag: d.tag, ex: d.ex.length, sets });
    }
  }
  return (
    <div className="ff">
      <div className="ff-body">
        <Top />
        <div style={{ marginBottom: 16 }}>
          <div className="ff-label">Coaching</div>
          <div className="ff-h1" style={{ fontSize: 22 }}>Deze week</div>
        </div>

        <div className="ff-statgrid" style={{ marginBottom: 16 }}>
          <div className="ff-stat"><div className="big">{sessions.length}</div><div className="lab">Trainingsdagen</div></div>
          <div className="ff-stat"><div className="big">{totalSets}</div><div className="lab">Sets gepland</div></div>
        </div>

        <div className="ff-sublabel" style={{ marginBottom: 10 }}>Sessies</div>
        <div className="ff-scroll">
          {sessions.map(s => (
            <div key={s.i} className="ff-srow" onClick={() => goDay(s.i)} style={{ cursor:'pointer' }}>
              <div>
                <div className="ff-srow-name">{s.title}</div>
                <div style={{ fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ff-muted)', marginTop:3, letterSpacing:'.04em' }}>{DAYS_LONG[s.i]} · {s.tag}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div className="ff-ex-meta">{s.ex} oef · {s.sets} sets</div>
                {Ic.chev(16)}
              </div>
            </div>
          ))}
          {sessions.length === 0 && <div className="ff-empty">Nog geen sessies gepland deze week.</div>}
        </div>
      </div>
    </div>
  );
}

function DoelenTab() {
  const goals = [
    { name: 'Bench Press · 1RM', cur: 72, target: 80, unit: 'kg' },
    { name: 'Squat · 1RM', cur: 96, target: 120, unit: 'kg' },
    { name: 'Lichaamsgewicht', cur: 79, target: 84, unit: 'kg' },
  ];
  return (
    <div className="ff">
      <div className="ff-body">
        <Top />
        <div style={{ marginBottom: 16 }}>
          <div className="ff-label">Doelen</div>
          <div className="ff-h1" style={{ fontSize: 22 }}>Voortgang</div>
        </div>

        <div className="ff-statgrid" style={{ marginBottom: 16 }}>
          <div className="ff-stat"><div className="big">4</div><div className="lab">Weken streak</div></div>
          <div className="ff-stat"><div className="big">12</div><div className="lab">Sessies deze maand</div></div>
        </div>

        <div className="ff-sublabel" style={{ marginBottom: 10 }}>Krachtdoelen</div>
        <div className="ff-scroll">
          {goals.map((g, i) => {
            const pct = Math.min(100, Math.round(g.cur / g.target * 100));
            return (
              <div key={i} className="ff-goal">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 10 }}>
                  <div style={{ fontSize:15, fontWeight:600 }}>{g.name}</div>
                  <div style={{ fontFamily:'var(--ff-mono)', fontSize:13, color:'var(--ff-muted)' }}>
                    <b style={{ color:'var(--ff-amber)' }}>{g.cur}</b> / {g.target} {g.unit}
                  </div>
                </div>
                <div className="ff-progress"><i style={{ width: pct + '%' }} /></div>
                <div style={{ fontFamily:'var(--ff-mono)', fontSize:10, color:'var(--ff-faint)', marginTop:8, letterSpacing:'.1em' }}>
                  NOG {g.target - g.cur} {g.unit.toUpperCase()} TE GAAN
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CoachingTab, DoelenTab });
