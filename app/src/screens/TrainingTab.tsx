import { DAYS_LONG, TODAY } from '../data/constants';
import { daysWithEx } from '../data/store';
import { Ic } from '../components/Icons';
import { TopBar } from '../components/TopBar';
import { DayStrip } from '../components/DayStrip';
import type { Store } from '../types';

export function TrainingTab({
  store,
  selDay,
  setSelDay,
  toggleSet,
  openFocus,
  openAdd,
}: {
  store: Store;
  selDay: number;
  setSelDay: (i: number) => void;
  toggleSet: (day: number, ei: number, si: number) => void;
  openFocus: (day: number, exIdx: number) => void;
  openAdd: (day: number) => void;
}) {
  const day = store.days[selDay];
  const dots = daysWithEx(store);

  let done = 0;
  let total = 0;
  if (day) day.ex.forEach((e) => e.sets.forEach((s) => { total++; if (s.done) done++; }));

  return (
    <div className="ff">
      <div className="ff-body">
        <TopBar />
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
                <button className="ff-btn ff-btn-primary" style={{ height: 48, fontSize: 12 }} onClick={() => openAdd(selDay)}>
                  + Oefening toevoegen
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div className="ff-label">
                  {selDay === TODAY ? 'Vandaag' : DAYS_LONG[selDay]} · {day.tag}
                </div>
                <div className="ff-h1">{day.title}</div>
              </div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, color: 'var(--ff-muted)' }}>
                <b style={{ color: 'var(--ff-amber)', fontSize: 18 }}>{done}</b>/{total}
              </div>
            </div>
            <div className="ff-progress" style={{ marginBottom: 16 }}>
              <i style={{ width: total ? (done / total) * 100 + '%' : '0%' }} />
            </div>

            <div className="ff-scroll">
              {day.ex.map((e, i) => {
                const exDone = e.sets.every((s) => s.done);
                const sd = e.sets.filter((s) => s.done).length;
                return (
                  <div key={i} className={'ff-ex' + (exDone ? ' done' : '')} onClick={() => openFocus(selDay, i)}>
                    <div className="ff-ex-head">
                      <div className="ff-ex-name">
                        {exDone && <span style={{ color: 'var(--ff-amber)', display: 'inline-flex' }}>{Ic.check(14)}</span>}
                        {e.name}
                      </div>
                      <div className="ff-ex-meta">
                        {sd}/{e.sets.length} sets {Ic.chev(15)}
                      </div>
                    </div>
                    <div className="ff-sets" onClick={(ev) => ev.stopPropagation()}>
                      {e.sets.map((s, j) => (
                        <div key={j} className={'ff-set' + (s.done ? ' on' : '')} onClick={() => toggleSet(selDay, i, j)}>
                          <div className="v">
                            {s.weight}
                            <span>kg</span>
                          </div>
                          <div className="k">{s.reps} REPS</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <button className="ff-btn ff-btn-ghost" style={{ marginTop: 12 }} onClick={() => openAdd(selDay)}>
                + Oefening
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
