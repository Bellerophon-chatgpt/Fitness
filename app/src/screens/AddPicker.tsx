import { useState } from 'react';
import { DAYS_SHORT, RECENTS } from '../data/constants';
import { Ic } from '../components/Icons';
import type { Store } from '../types';

export function AddPicker({
  store,
  day,
  addExercise,
  onClose,
}: {
  store: Store;
  day: number;
  addExercise: (day: number, name: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const existing = new Set((store.days[day]?.ex || []).map((e) => e.name.toLowerCase()));
  const ql = q.trim().toLowerCase();
  const matches = RECENTS.filter((r) => r.toLowerCase().includes(ql));
  const isNew = ql.length > 0 && !RECENTS.some((r) => r.toLowerCase() === ql);

  return (
    <div className="ff-overlay">
      <div className="ff-ohead">
        <button className="ff-x" onClick={onClose}>{Ic.close(18)}</button>
        <div className="ff-sublabel">Oefening toevoegen · {DAYS_SHORT[day]}</div>
        <div className="ff-x" style={{ borderColor: 'transparent', background: 'transparent' }} />
      </div>
      <div className="ff-obody">
        <input
          className="ff-search"
          placeholder="Zoek of typ een nieuwe oefening…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />

        {isNew && (
          <div
            className="ff-chip"
            style={{ marginTop: 12, justifyContent: 'center', borderColor: 'var(--ff-amber-dim)' }}
            onClick={() => { addExercise(day, q.trim()); setQ(''); }}
          >
            <span className="plus">+</span> Voeg "{q.trim()}" toe
          </div>
        )}

        <div className="ff-sublabel" style={{ margin: '18px 0 2px' }}>Recent gebruikt — tik om toe te voegen</div>
        <div className="ff-chips">
          {matches.map((r) => {
            const added = existing.has(r.toLowerCase());
            return (
              <div key={r} className={'ff-chip' + (added ? ' added' : '')} onClick={() => !added && addExercise(day, r)}>
                <span className="plus">{added ? Ic.check(12) : '+'}</span>{r}
              </div>
            );
          })}
          {matches.length === 0 && !isNew && (
            <div style={{ color: 'var(--ff-faint)', fontSize: 13, fontFamily: 'var(--ff-mono)', padding: '8px 2px' }}>Geen resultaten</div>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 20 }} />
        <button className="ff-btn ff-btn-primary" onClick={onClose}>Klaar</button>
      </div>
    </div>
  );
}
