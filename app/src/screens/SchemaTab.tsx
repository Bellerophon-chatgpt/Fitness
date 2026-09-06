import { useRef, useState } from 'react';
import { newId } from '../data/nutrition';
import { Ic } from '../components/Icons';
import { TopBar } from '../components/TopBar';
import { buzz } from '../utils/feedback';
import type { Routine, Store } from '../types';

interface DragState { idx: number; pointerStart: number }

export function SchemaTab({
  store,
  addRoutine,
  updateRoutineMeta,
  deleteRoutine,
  setExerciseSets,
  removeExercise,
  moveExercise,
  openAdd,
}: {
  store: Store;
  addRoutine: (r: Routine) => void;
  updateRoutineMeta: (id: string, patch: Partial<Pick<Routine, 'title' | 'tag'>>) => void;
  deleteRoutine: (id: string) => void;
  setExerciseSets: (id: string, ei: number, count: number) => void;
  removeExercise: (id: string, ei: number) => void;
  moveExercise: (id: string, from: number, to: number) => void;
  openAdd: (routineId: string) => void;
}) {
  const routines = store.routines ?? [];
  const [selId, setSelId] = useState<string | null>(null);
  const routine = routines.find((r) => r.id === selId) || null;

  const create = () => {
    const r: Routine = { id: newId(), title: 'Nieuwe routine', tag: 'Training', ex: [] };
    addRoutine(r);
    setSelId(r.id);
  };

  // --- routine list ---
  if (!routine) {
    return (
      <div className="ff">
        <div className="ff-body">
          <TopBar />
          <div style={{ marginBottom: 14 }}>
            <div className="ff-label">Schema</div>
            <div className="ff-h1" style={{ fontSize: 22 }}>Routines</div>
          </div>
          <div className="ff-scroll">
            {routines.length === 0 && <div className="ff-empty" style={{ marginBottom: 14 }}>Nog geen routines. Maak er een aan om te beginnen.</div>}
            {routines.map((r) => (
              <div key={r.id} className="ff-rt" onClick={() => setSelId(r.id)}>
                <div style={{ minWidth: 0 }}>
                  <div className="ff-rt-title">{r.title}</div>
                  <div className="ff-rt-sub">{r.tag} · {r.ex.length} oefening{r.ex.length !== 1 ? 'en' : ''}</div>
                </div>
                <span className="ff-rt-go">{Ic.chev(16)}</span>
              </div>
            ))}
            <button className="ff-btn ff-btn-primary" style={{ marginTop: 14 }} onClick={create}>+ Nieuwe routine</button>
            <div style={{ height: 8 }} />
          </div>
        </div>
      </div>
    );
  }

  // --- routine editor ---
  return <RoutineEditor
    routine={routine}
    onBack={() => setSelId(null)}
    updateRoutineMeta={updateRoutineMeta}
    deleteRoutine={(id) => { deleteRoutine(id); setSelId(null); }}
    setExerciseSets={setExerciseSets}
    removeExercise={removeExercise}
    moveExercise={moveExercise}
    openAdd={openAdd}
  />;
}

function RoutineEditor({
  routine,
  onBack,
  updateRoutineMeta,
  deleteRoutine,
  setExerciseSets,
  removeExercise,
  moveExercise,
  openAdd,
}: {
  routine: Routine;
  onBack: () => void;
  updateRoutineMeta: (id: string, patch: Partial<Pick<Routine, 'title' | 'tag'>>) => void;
  deleteRoutine: (id: string) => void;
  setExerciseSets: (id: string, ei: number, count: number) => void;
  removeExercise: (id: string, ei: number) => void;
  moveExercise: (id: string, from: number, to: number) => void;
  openAdd: (routineId: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const [dragIdx, setDragIdx] = useState(-1);
  const [dragY, setDragY] = useState(0);

  const onGripDown = (e: React.PointerEvent, startIdx: number) => {
    e.preventDefault();
    drag.current = { idx: startIdx, pointerStart: e.clientY };
    setDragIdx(startIdx);
    setDragY(0);
    try { (e.target as Element).setPointerCapture(e.pointerId); } catch { /* unsupported */ }
  };
  const onGripMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const d = drag.current;
    setDragY(e.clientY - d.pointerStart);
    const rows = [...listRef.current!.querySelectorAll('.ff-srow')];
    const y = e.clientY;
    let target = d.idx;
    for (let i = 0; i < rows.length; i++) {
      if (i === d.idx) continue;
      const r = rows[i].getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (d.idx < i && y > mid) target = i;
      if (d.idx > i && y < mid) target = i;
    }
    if (target !== d.idx) {
      moveExercise(routine.id, d.idx, target);
      d.idx = target;
      setDragIdx(target);
      d.pointerStart = e.clientY;
      setDragY(0);
      buzz();
    }
  };
  const onGripUp = (e: React.PointerEvent) => {
    drag.current = null;
    setDragIdx(-1);
    setDragY(0);
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch { /* no-op */ }
  };

  return (
    <div className="ff">
      <div className="ff-body">
        <div className="ff-ohead" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <button className="ff-x" onClick={onBack}>{Ic.chev(18, 'currentColor')}</button>
          <div className="ff-sublabel">Routine bewerken</div>
          <button className="ff-x" onClick={() => { if (confirm(`Routine "${routine.title}" verwijderen?`)) deleteRoutine(routine.id); }} aria-label="Verwijderen">{Ic.trash(17)}</button>
        </div>

        <input
          className="ff-title-input"
          value={routine.title}
          onChange={(e) => updateRoutineMeta(routine.id, { title: e.target.value })}
          placeholder="Naam van de routine"
        />
        <input
          className="ff-search"
          style={{ marginTop: 8 }}
          value={routine.tag}
          onChange={(e) => updateRoutineMeta(routine.id, { tag: e.target.value })}
          placeholder="Label (bijv. Push, Upper, A)"
        />

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '16px 0 10px' }}>
          <div className="ff-sublabel">Oefeningen</div>
          {routine.ex.length > 1 && <div className="ff-sublabel" style={{ color: 'var(--ff-faint)' }}>sleep ☰ om te ordenen</div>}
        </div>

        <div className="ff-scroll" ref={listRef}>
          {routine.ex.length === 0 ? (
            <div className="ff-empty">Nog geen oefeningen.</div>
          ) : (
            routine.ex.map((e, i) => (
              <div
                key={e.name + '_' + i}
                className={'ff-srow' + (dragIdx === i ? ' dragging' : '')}
                style={dragIdx === i ? { transform: `translateY(${dragY}px)` } : undefined}
              >
                <div className="ff-grip" onPointerDown={(ev) => onGripDown(ev, i)} onPointerMove={onGripMove} onPointerUp={onGripUp} onPointerCancel={onGripUp}>
                  {Ic.grip(20)}
                </div>
                <div className="ff-srow-name">{e.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="ff-mini">
                    <button onClick={() => setExerciseSets(routine.id, i, e.sets.length - 1)}>−</button>
                    <div className="v">{e.sets.length} set{e.sets.length !== 1 ? 's' : ''}</div>
                    <button onClick={() => setExerciseSets(routine.id, i, e.sets.length + 1)}>+</button>
                  </div>
                  <button className="ff-del" onClick={() => removeExercise(routine.id, i)}>{Ic.close(15, '#8a8a90')}</button>
                </div>
              </div>
            ))
          )}
          <button className="ff-btn ff-btn-ghost" style={{ marginTop: 12 }} onClick={() => openAdd(routine.id)}>
            + Oefening toevoegen
          </button>
          <div style={{ height: 8 }} />
        </div>
      </div>
    </div>
  );
}
