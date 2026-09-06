import { TODAY, DAYS_LONG, MONTHS } from '../data/constants';
import { dateKey } from '../data/nutrition';
import { Ic } from '../components/Icons';
import { TopBar } from '../components/TopBar';
import type { Routine, Store } from '../types';

export function TrainingTab({
  store,
  openFocus,
  toggleSession,
  startWorkout,
  toggleLiveSet,
  finishWorkout,
  discardWorkout,
}: {
  store: Store;
  openFocus: (exIdx: number) => void;
  toggleSession: () => void;
  startWorkout: (routineId: string) => void;
  toggleLiveSet: (ei: number, si: number) => void;
  finishWorkout: () => void;
  discardWorkout: () => void;
}) {
  const live = store.liveWorkout;
  const routines = store.routines ?? [];
  const todayLogged = (store.sessions ?? []).some((s) => s.date === dateKey(new Date()));
  const now = new Date();
  const todayLabel = `${DAYS_LONG[TODAY]} · ${now.getDate()} ${MONTHS[now.getMonth()]}`;

  // --- A live workout is in progress ---
  if (live) {
    let done = 0;
    let total = 0;
    live.ex.forEach((e) => e.sets.forEach((s) => { total++; if (s.done) done++; }));
    return (
      <div className="ff">
        <div className="ff-body">
          <TopBar />
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div className="ff-label" style={{ color: 'var(--ff-amber)' }}>Bezig · {live.tag}</div>
              <div className="ff-h1">{live.title}</div>
            </div>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, color: 'var(--ff-muted)' }}>
              <b style={{ color: 'var(--ff-amber)', fontSize: 18 }}>{done}</b>/{total}
            </div>
          </div>
          <div className="ff-progress" style={{ marginBottom: 16 }}>
            <i style={{ width: total ? (done / total) * 100 + '%' : '0%' }} />
          </div>

          <div className="ff-scroll">
            {live.ex.map((e, i) => {
              const exDone = e.sets.every((s) => s.done);
              const sd = e.sets.filter((s) => s.done).length;
              return (
                <div key={i} className={'ff-ex' + (exDone ? ' done' : '')} onClick={() => openFocus(i)}>
                  <div className="ff-ex-head">
                    <div className="ff-ex-name">
                      {exDone && <span style={{ color: 'var(--ff-amber)', display: 'inline-flex' }}>{Ic.check(14)}</span>}
                      {e.name}
                    </div>
                    <div className="ff-ex-meta">{sd}/{e.sets.length} sets {Ic.chev(15)}</div>
                  </div>
                  <div className="ff-sets" onClick={(ev) => ev.stopPropagation()}>
                    {e.sets.map((s, j) => (
                      <div key={j} className={'ff-set' + (s.done ? ' on' : '')} onClick={() => toggleLiveSet(i, j)}>
                        <div className="v">{s.weight}<span>kg</span></div>
                        <div className="k">{s.reps} REPS</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <button className="ff-btn ff-btn-primary" style={{ marginTop: 14 }} onClick={finishWorkout}>Training afronden ✓</button>
            <button className="ff-link-btn" onClick={() => { if (confirm('Deze sessie verwerpen? Je logt niets.')) discardWorkout(); }}>Verwerp sessie</button>
            <div style={{ height: 8 }} />
          </div>
        </div>
      </div>
    );
  }

  // --- Pick a routine to start ---
  return (
    <div className="ff">
      <div className="ff-body">
        <TopBar />
        <div style={{ marginBottom: 14 }}>
          <div className="ff-label">{todayLabel}</div>
          <div className="ff-h1" style={{ fontSize: 22 }}>Wat train je?</div>
        </div>

        <div className="ff-scroll">
          {routines.length === 0 ? (
            <div className="ff-empty">Nog geen routines. Maak er een aan in de Schema-tab.</div>
          ) : (
            routines.map((r) => <RoutineCard key={r.id} routine={r} store={store} onStart={() => startWorkout(r.id)} />)
          )}

          <div className="ff-sublabel" style={{ margin: '22px 0 10px' }}>Anders</div>
          <button className={'ff-loglog' + (todayLogged ? ' done' : '')} onClick={toggleSession}>
            {todayLogged ? <>{Ic.check(15)} Vandaag afgerond — tik om ongedaan te maken</> : <>Iets anders getraind? Markeer als afgerond</>}
          </button>
          <div style={{ height: 8 }} />
        </div>
      </div>
    </div>
  );
}

function RoutineCard({ routine, store, onStart }: { routine: Routine; store: Store; onStart: () => void }) {
  const top = routine.ex.slice(0, 3).map((e) => e.name).join(' · ');
  const lastDone = (() => {
    // most recent session whose title matches this routine
    const log = store.sessions ?? [];
    for (let i = log.length - 1; i >= 0; i--) if (log[i].title === routine.title) return log[i].date;
    return null;
  })();
  const daysAgo = lastDone ? Math.round((Date.now() - new Date(lastDone).getTime()) / 86400000) : null;

  return (
    <div className="ff-rtcard">
      <div className="ff-rtcard-head">
        <div style={{ minWidth: 0 }}>
          <div className="ff-rtcard-title">{routine.title}</div>
          <div className="ff-rtcard-sub">{routine.tag} · {routine.ex.length} oefening{routine.ex.length !== 1 ? 'en' : ''}{daysAgo != null ? ` · ${daysAgo === 0 ? 'vandaag' : daysAgo + 'd geleden'}` : ''}</div>
        </div>
      </div>
      {top && <div className="ff-rtcard-ex">{top}{routine.ex.length > 3 ? ' …' : ''}</div>}
      <button className="ff-btn ff-btn-primary" style={{ marginTop: 12, height: 46, fontSize: 12 }} disabled={routine.ex.length === 0} onClick={onStart}>
        Start workout
      </button>
    </div>
  );
}
