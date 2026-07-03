import { TopBar } from '../components/TopBar';

const GOALS = [
  { name: 'Bench Press · 1RM', cur: 72, target: 80, unit: 'kg' },
  { name: 'Squat · 1RM', cur: 96, target: 120, unit: 'kg' },
  { name: 'Lichaamsgewicht', cur: 79, target: 84, unit: 'kg' },
];

export function DoelenTab() {
  return (
    <div className="ff">
      <div className="ff-body">
        <TopBar />
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
          {GOALS.map((g, i) => {
            const pct = Math.min(100, Math.round((g.cur / g.target) * 100));
            return (
              <div key={i} className="ff-goal">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{g.name}</div>
                  <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, color: 'var(--ff-muted)' }}>
                    <b style={{ color: 'var(--ff-amber)' }}>{g.cur}</b> / {g.target} {g.unit}
                  </div>
                </div>
                <div className="ff-progress"><i style={{ width: pct + '%' }} /></div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ff-faint)', marginTop: 8, letterSpacing: '.1em' }}>
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
