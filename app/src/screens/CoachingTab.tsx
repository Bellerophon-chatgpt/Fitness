import { DAYS_LONG } from '../data/constants';
import { Ic } from '../components/Icons';
import { TopBar } from '../components/TopBar';
import type { Store } from '../types';

export function CoachingTab({ store, goDay }: { store: Store; goDay: (i: number) => void }) {
  const sessions: { i: number; title: string; tag: string; ex: number; sets: number }[] = [];
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
        <TopBar />
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
          {sessions.map((s) => (
            <div key={s.i} className="ff-srow" onClick={() => goDay(s.i)} style={{ cursor: 'pointer' }}>
              <div>
                <div className="ff-srow-name">{s.title}</div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ff-muted)', marginTop: 3, letterSpacing: '.04em' }}>
                  {DAYS_LONG[s.i]} · {s.tag}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
