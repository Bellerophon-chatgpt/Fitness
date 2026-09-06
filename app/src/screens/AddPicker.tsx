import { useMemo, useState } from 'react';
import { DAYS_SHORT } from '../data/constants';
import { allExercises, MUSCLE_LABEL, MUSCLES } from '../data/exercises';
import { newId } from '../data/nutrition';
import { Ic } from '../components/Icons';
import type { ExerciseDef, Muscle, Store } from '../types';

export function AddPicker({
  store,
  day,
  addExercise,
  registerExercise,
  onClose,
}: {
  store: Store;
  day: number;
  addExercise: (day: number, name: string) => void;
  registerExercise: (def: ExerciseDef) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState<Muscle | 'all'>('all');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState<Muscle>('chest');

  const library = useMemo(() => allExercises(store).sort((a, b) => a.name.localeCompare(b.name)), [store]);
  const existing = new Set((store.days[day]?.ex || []).map((e) => e.name.toLowerCase()));
  const ql = q.trim().toLowerCase();

  const filtered = library.filter(
    (d) => (muscle === 'all' || d.muscle === muscle) && (!ql || d.name.toLowerCase().includes(ql)),
  );
  const exactExists = library.some((d) => d.name.toLowerCase() === ql);

  const createCustom = () => {
    const name = (creating ? newName : q).trim();
    if (!name) return;
    const def: ExerciseDef = { id: newId(), name, muscle: newMuscle, custom: true };
    registerExercise(def);
    addExercise(day, name);
    setCreating(false);
    setNewName('');
    setQ('');
  };

  if (creating) {
    return (
      <div className="ff-overlay">
        <div className="ff-ohead">
          <button className="ff-x" onClick={() => setCreating(false)}>{Ic.chev(18, 'currentColor')}</button>
          <div className="ff-sublabel">Eigen oefening</div>
          <div className="ff-x" style={{ borderColor: 'transparent', background: 'transparent' }} />
        </div>
        <div className="ff-obody">
          <input className="ff-search" placeholder="Naam van de oefening" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
          <div className="ff-sublabel" style={{ margin: '16px 0 8px' }}>Spiergroep</div>
          <div className="ff-musclegrid">
            {MUSCLES.map((m) => (
              <button key={m} className={'ff-muscle-btn' + (newMuscle === m ? ' on' : '')} onClick={() => setNewMuscle(m)}>{MUSCLE_LABEL[m]}</button>
            ))}
          </div>
          <div style={{ flex: 1, minHeight: 20 }} />
          <button className="ff-btn ff-btn-primary" disabled={!newName.trim()} onClick={createCustom}>Toevoegen aan schema</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ff-overlay">
      <div className="ff-ohead">
        <button className="ff-x" onClick={onClose}>{Ic.close(18)}</button>
        <div className="ff-sublabel">Oefening toevoegen · {DAYS_SHORT[day]}</div>
        <div className="ff-x" style={{ borderColor: 'transparent', background: 'transparent' }} />
      </div>
      <div className="ff-obody">
        <input className="ff-search" placeholder="Zoek een oefening…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />

        <div className="ff-musclefilter">
          <button className={'ff-mf' + (muscle === 'all' ? ' on' : '')} onClick={() => setMuscle('all')}>Alle</button>
          {MUSCLES.map((m) => (
            <button key={m} className={'ff-mf' + (muscle === m ? ' on' : '')} onClick={() => setMuscle(m)}>{MUSCLE_LABEL[m]}</button>
          ))}
        </div>

        <div className="ff-scroll" style={{ margin: '12px -18px 0' }}>
          <div style={{ padding: '0 18px' }}>
            {ql && !exactExists && (
              <div className="ff-exrow ff-exrow-new" onClick={() => { setNewName(q.trim()); setCreating(true); }}>
                <div><span className="plus">+</span> Nieuwe oefening "{q.trim()}"</div>
                <span className="ff-exrow-add">{Ic.chev(15)}</span>
              </div>
            )}
            {filtered.map((d) => {
              const added = existing.has(d.name.toLowerCase());
              return (
                <div key={d.id} className={'ff-exrow' + (added ? ' added' : '')} onClick={() => !added && addExercise(day, d.name)}>
                  <div style={{ minWidth: 0 }}>
                    <div className="ff-exrow-name">{d.name}</div>
                    <div className="ff-exrow-muscle">{MUSCLE_LABEL[d.muscle]}{d.custom ? ' · eigen' : ''}</div>
                  </div>
                  <span className="ff-exrow-add">{added ? Ic.check(15) : Ic.chev(15)}</span>
                </div>
              );
            })}
            {filtered.length === 0 && !ql && (
              <div style={{ color: 'var(--ff-faint)', fontSize: 13, fontFamily: 'var(--ff-mono)', padding: '8px 2px' }}>Geen oefeningen in deze groep</div>
            )}
            <button className="ff-btn ff-btn-ghost" style={{ marginTop: 14 }} onClick={() => { setNewName(q.trim()); setCreating(true); }}>+ Eigen oefening maken</button>
            <div style={{ height: 8 }} />
          </div>
        </div>
        <button className="ff-btn ff-btn-primary" style={{ marginTop: 10 }} onClick={onClose}>Klaar</button>
      </div>
    </div>
  );
}
