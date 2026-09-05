import { DAYS_LONG, TODAY } from '../data/constants';
import { daysWithEx } from '../data/store';
import { dateKey } from '../data/nutrition';
import { lastPerformance } from '../data/workout';
import { Ic } from '../components/Icons';
import { TopBar } from '../components/TopBar';
import { DayStrip } from '../components/DayStrip';
import type { Exercise, Store } from '../types';

export function TrainingTab({
  store,
  selDay,
  setSelDay,
  openFocus,
  openAdd,
  toggleSession,
  startWorkout,
  toggleLiveSet,
  finishWorkout,
  discardWorkout,
}: {
  store: Store;
  selDay: number;
  setSelDay: (i: number) => void;
  openFocus: (exIdx: number) => void;
  openAdd: (day: number) => void;
  toggleSession: () => void;
  startWorkout: () => void;
  toggleLiveSet: (ei: number, si: number) => void;
  finishWorkout: () => void;
  discardWorkout: () => void;
}) {
  const dots = daysWithEx(store);
  const isToday = selDay === TODAY;
  const live = store.liveWorkout;
  const routine = store.days[selDay];
  const todayLogged = (store.sessions ?? []).some((s) => s.date === dateKey(new Date()));

  const header = (
    <>
      <TopBar />
      <div style={{ marginBottom: 12 }}>
        <DayStrip sel={selDay} onSel={setSelDay} dotDays={dots} />
      </div>
    </>
  );

  // 1) A live workout is in progress (always about today)
  if (live && isToday) {
    let done = 0;
    let total = 0;
    live.ex.forEach((e) => e.sets.forEach((s) => { total++; if (s.done) done++; }));
    return (
      <div className="ff">
        <div className="ff-body">
          {header}
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
            <button className="ff-btn ff-btn-primary" style={{ marginTop: 14 }} onClick={finishWorkout}>
              Training afronden ✓
            </button>
            <button className="ff-link-btn" onClick={() => { if (confirm('Deze sessie verwerpen? Je logt niets.')) discardWorkout(); }}>
              Verwerp sessie
            </button>
            <div style={{ height: 8 }} />
          </div>
        </div>
      </div>
    );
  }

  // 2) Today, a routine exists, not started yet → preview + Start
  if (isToday && routine && routine.ex.length > 0) {
    return (
      <div className="ff">
        <div className="ff-body">
          {header}
          <div style={{ marginBottom: 12 }}>
            <div className="ff-label">Vandaag · {routine.tag}</div>
            <div className="ff-h1">{routine.title}</div>
          </div>
          <button className="ff-btn ff-btn-primary" onClick={startWorkout}>Start workout</button>
          {todayLogged && (
            <div className="ff-hint-line">Je hebt vandaag al een training gelogd — starten voegt een nieuwe toe.</div>
          )}

          <div className="ff-scroll" style={{ marginTop: 16 }}>
            <div className="ff-sublabel" style={{ marginBottom: 8 }}>Vandaag op het programma</div>
            {routine.ex.map((e, i) => <PreviewRow key={i} ex={e} store={store} />)}
            <button className="ff-btn ff-btn-ghost" style={{ marginTop: 12 }} onClick={() => openAdd(selDay)}>+ Oefening</button>
            <div style={{ height: 8 }} />
          </div>
        </div>
      </div>
    );
  }

  // 3) Today is a rest day (no routine) → quick-log option
  if (isToday) {
    return (
      <div className="ff">
        <div className="ff-body">
          {header}
          <div className="ff-scroll">
            <div style={{ marginBottom: 14 }}>
              <div className="ff-label">{DAYS_LONG[selDay]}</div>
              <div className="ff-h1">Rustdag</div>
            </div>
            <div className="ff-empty">
              Geen routine voor vandaag.
              <div style={{ marginTop: 14 }}>
                <button className="ff-btn ff-btn-primary" style={{ height: 48, fontSize: 12 }} onClick={() => openAdd(selDay)}>+ Oefening toevoegen</button>
              </div>
            </div>
            <button className={'ff-loglog' + (todayLogged ? ' done' : '')} style={{ marginTop: 16 }} onClick={toggleSession}>
              {todayLogged ? <>{Ic.check(15)} Getraind — tik om ongedaan te maken</> : <>Toch getraind? Markeer als afgerond</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4) Another weekday → read-only routine preview
  return (
    <div className="ff">
      <div className="ff-body">
        {header}
        <div style={{ marginBottom: 12 }}>
          <div className="ff-label">{DAYS_LONG[selDay]}{routine ? ' · ' + routine.tag : ''}</div>
          <div className="ff-h1">{routine?.title ?? 'Rustdag'}</div>
        </div>
        <div className="ff-scroll">
          {routine && routine.ex.length > 0 ? (
            <>
              <div className="ff-sublabel" style={{ marginBottom: 8 }}>Op het programma</div>
              {routine.ex.map((e, i) => <PreviewRow key={i} ex={e} store={store} />)}
              <div className="ff-hint-line">Je kunt alleen de training van vandaag starten.</div>
            </>
          ) : (
            <div className="ff-empty">Geen oefeningen voor {DAYS_LONG[selDay].toLowerCase()}.</div>
          )}
          <div style={{ height: 8 }} />
        </div>
      </div>
    </div>
  );
}

function PreviewRow({ ex, store }: { ex: Exercise; store: Store }) {
  const prev = lastPerformance(store.workoutLog, ex.name);
  const top = prev ? prev.sets.reduce((a, s) => (s.weight > a.weight ? s : a), prev.sets[0]) : null;
  return (
    <div className="ff-prev">
      <div className="ff-prev-name">{ex.name}</div>
      <div className="ff-prev-meta">
        {ex.sets.length} sets{top ? ` · vorige ${top.weight}kg × ${top.reps}` : ''}
      </div>
    </div>
  );
}
