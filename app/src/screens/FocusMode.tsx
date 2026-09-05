import { useEffect, useState } from 'react';
import { Ic } from '../components/Icons';
import { EditNum } from '../components/EditNum';
import { ping, buzz } from '../utils/feedback';
import { bestE1RM, bestE1RMHistory, epley1RM } from '../data/workout';
import type { Exercise, SetEntry, WorkoutSession } from '../types';

const REST_SECONDS = 90;

export function FocusMode({
  exs,
  exIdx,
  workoutLog,
  updateSet,
  onClose,
  onNav,
  onFinish,
}: {
  exs: Exercise[];
  exIdx: number;
  workoutLog?: WorkoutSession[];
  updateSet: (ei: number, si: number, patch: Partial<SetEntry>) => void;
  onClose: () => void;
  onNav: (dir: 1 | -1) => void;
  onFinish: () => void;
}) {
  const ex = exs[exIdx];
  const [resting, setResting] = useState(false);
  const [t, setT] = useState(REST_SECONDS);

  useEffect(() => {
    if (!resting) return;
    if (t <= 0) {
      ping();
      buzz();
      setResting(false);
      setT(REST_SECONDS);
      return;
    }
    const id = setTimeout(() => setT((x) => x - 1), 1000);
    return () => clearTimeout(id);
  }, [resting, t]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const cur = ex.sets.findIndex((s) => !s.done);
  const allDone = cur === -1;
  const idx = allDone ? ex.sets.length - 1 : cur;
  const setObj = ex.sets[idx];

  // history-based context for this exercise
  const priorBest = bestE1RMHistory(workoutLog, ex.name);
  const liveBest = bestE1RM(ex.sets.filter((s) => s.done).map((s) => ({ weight: s.weight, reps: s.reps })));
  const curE1RM = epley1RM(setObj.weight, setObj.reps);
  const isPR = liveBest > priorBest + 0.01 && priorBest > 0;

  const bump = (field: 'weight' | 'reps', delta: number, min = 0) =>
    updateSet(exIdx, idx, { [field]: Math.max(min, Math.round((setObj[field] + delta) * 10) / 10) });
  const finishSet = () => {
    updateSet(exIdx, cur, { done: true });
    if (cur < ex.sets.length - 1) {
      setT(REST_SECONDS);
      setResting(true);
    }
  };
  const hasNext = exIdx < exs.length - 1;

  return (
    <div className="ff-overlay">
      <div className="ff-ohead">
        <button className="ff-x" onClick={onClose}>{Ic.close(18)}</button>
        <div className="ff-sublabel">Oefening {exIdx + 1} / {exs.length}</div>
        <div className="ff-x" style={{ borderColor: 'transparent', background: 'transparent' }} />
      </div>

      <div className="ff-obody">
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <div className="ff-h1" style={{ fontSize: 30 }}>{ex.name}</div>
          <div style={{ marginTop: 7, fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ff-muted)', letterSpacing: '.02em' }}>
            {setObj.last ? (
              <>vorige keer · <b style={{ color: 'var(--ff-text)' }}>{setObj.last.weight} kg × {setObj.last.reps}</b></>
            ) : (
              'nieuwe oefening'
            )}
            {priorBest > 0 && <> · beste ~{Math.round(priorBest)} kg</>}
          </div>
          {isPR && <div className="ff-pr">Nieuw PR — ~{Math.round(liveBest)} kg 1RM</div>}
          <div style={{ marginTop: 9, display: 'flex', justifyContent: 'center' }}>
            <div className="ff-dots">
              {ex.sets.map((s, i) => (
                <div key={i} className={'ff-dot' + (s.done ? ' done' : i === cur ? ' cur' : '')} />
              ))}
            </div>
          </div>
        </div>

        {allDone ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 99, background: 'var(--ff-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {Ic.check(30)}
            </div>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, letterSpacing: '.1em', color: 'var(--ff-muted)' }}>ALLE SETS KLAAR</div>
          </div>
        ) : (
          <div style={{ marginTop: 18 }}>
            <div className="ff-sublabel" style={{ marginBottom: 8 }}>Gewicht · set {idx + 1}</div>
            <div className="ff-stepper" style={{ marginBottom: 16 }}>
              <button className="ff-step-btn" onClick={() => bump('weight', -2.5)}>−</button>
              <EditNum value={setObj.weight} unit="KG" onCommit={(v) => updateSet(exIdx, idx, { weight: v })} />
              <button className="ff-step-btn" onClick={() => bump('weight', 2.5)}>+</button>
            </div>
            <div className="ff-sublabel" style={{ marginBottom: 8 }}>Herhalingen</div>
            <div className="ff-stepper">
              <button className="ff-step-btn" onClick={() => bump('reps', -1)}>−</button>
              <EditNum value={setObj.reps} unit="REPS" round onCommit={(v) => updateSet(exIdx, idx, { reps: v })} />
              <button className="ff-step-btn" onClick={() => bump('reps', 1)}>+</button>
            </div>
            <div style={{ marginTop: 12, textAlign: 'center', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ff-faint)', letterSpacing: '.04em' }}>
              ~{Math.round(curE1RM)} kg geschat 1RM · tik het getal om te typen
            </div>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 16 }} />

        {allDone ? (
          <button className="ff-btn ff-btn-primary" onClick={() => (hasNext ? onNav(1) : onFinish())}>
            {hasNext ? 'Volgende oefening →' : 'Training afronden ✓'}
          </button>
        ) : (
          <button className="ff-btn ff-btn-primary" onClick={finishSet}>Set {idx + 1} klaar →</button>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 2px 6px' }}>
          <div
            onClick={() => exIdx > 0 && onNav(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: exIdx > 0 ? 'var(--ff-muted)' : 'var(--ff-faint)', fontFamily: 'var(--ff-mono)', fontSize: 12, cursor: exIdx > 0 ? 'pointer' : 'default' }}
          >
            <span style={{ transform: 'scaleX(-1)', display: 'inline-flex' }}>{Ic.chev(16, exIdx > 0 ? '#8a8a90' : '#3a3a3e')}</span> Vorige
          </div>
          <div
            onClick={() => hasNext && onNav(1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: hasNext ? 'var(--ff-amber)' : 'var(--ff-faint)', fontFamily: 'var(--ff-mono)', fontSize: 12, cursor: hasNext ? 'pointer' : 'default' }}
          >
            Volgende {Ic.chev(16, hasNext ? '#efa320' : '#3a3a3e')}
          </div>
        </div>
      </div>

      {resting && (
        <div className="ff-rest">
          <div className="ff-sublabel" style={{ color: 'var(--ff-amber)' }}>Rust</div>
          <div className="num">{fmt(t)}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ff-btn ff-btn-ghost" style={{ width: 130 }} onClick={() => setT((x) => x + 30)}>+30 sec</button>
            <button className="ff-btn ff-btn-primary" style={{ width: 130, height: 50, fontSize: 12 }} onClick={() => { setResting(false); setT(REST_SECONDS); }}>Sla over</button>
          </div>
        </div>
      )}
    </div>
  );
}
