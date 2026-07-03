import { useRef, useState } from 'react';
import { DAYS_LONG } from '../data/constants';
import { daysWithEx } from '../data/store';
import { Ic } from '../components/Icons';
import { TopBar } from '../components/TopBar';
import { DayStrip } from '../components/DayStrip';
import { buzz } from '../utils/feedback';
import type { Store } from '../types';

interface DragState {
  idx: number;
  pointerStart: number;
  rowTop: number;
}

export function SchemaTab({
  store,
  selDay,
  setSelDay,
  setExerciseSets,
  removeExercise,
  moveExercise,
  openAdd,
}: {
  store: Store;
  selDay: number;
  setSelDay: (i: number) => void;
  setExerciseSets: (day: number, ei: number, count: number) => void;
  removeExercise: (day: number, ei: number) => void;
  moveExercise: (day: number, from: number, to: number) => void;
  openAdd: (day: number) => void;
}) {
  const day = store.days[selDay];
  const dots = daysWithEx(store);
  const listRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const [dragIdx, setDragIdx] = useState(-1);
  const [dragY, setDragY] = useState(0);

  const onGripDown = (e: React.PointerEvent, startIdx: number) => {
    e.preventDefault();
    const rows = [...listRef.current!.querySelectorAll('.ff-srow')];
    drag.current = {
      idx: startIdx,
      pointerStart: e.clientY,
      rowTop: rows[startIdx].getBoundingClientRect().top,
    };
    setDragIdx(startIdx);
    setDragY(0);
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      // pointer capture unsupported — drag still works via move/up handlers
    }
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
      moveExercise(selDay, d.idx, target);
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
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      // no-op
    }
  };

  return (
    <div className="ff">
      <div className="ff-body">
        <TopBar />
        <div style={{ marginBottom: 14 }}>
          <div className="ff-label">Schema beheren</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <DayStrip sel={selDay} onSel={setSelDay} dotDays={dots} />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="ff-h1" style={{ fontSize: 20 }}>{DAYS_LONG[selDay]}</div>
          {day && <div className="ff-sublabel">{day.ex.length > 1 ? 'sleep ☰ om te ordenen' : day.tag}</div>}
        </div>

        <div className="ff-scroll" ref={listRef}>
          {!day || day.ex.length === 0 ? (
            <div className="ff-empty">
              Nog geen oefeningen.
              <div style={{ marginTop: 14 }}>
                <button className="ff-btn ff-btn-primary" style={{ height: 48, fontSize: 12 }} onClick={() => openAdd(selDay)}>
                  + Oefening toevoegen
                </button>
              </div>
            </div>
          ) : (
            <>
              {day.ex.map((e, i) => (
                <div
                  key={e.name + '_' + i}
                  className={'ff-srow' + (dragIdx === i ? ' dragging' : '')}
                  style={dragIdx === i ? { transform: `translateY(${dragY}px)` } : undefined}
                >
                  <div
                    className="ff-grip"
                    onPointerDown={(ev) => onGripDown(ev, i)}
                    onPointerMove={onGripMove}
                    onPointerUp={onGripUp}
                    onPointerCancel={onGripUp}
                  >
                    {Ic.grip(20)}
                  </div>
                  <div className="ff-srow-name">{e.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="ff-mini">
                      <button onClick={() => setExerciseSets(selDay, i, e.sets.length - 1)}>−</button>
                      <div className="v">{e.sets.length} set{e.sets.length !== 1 ? 's' : ''}</div>
                      <button onClick={() => setExerciseSets(selDay, i, e.sets.length + 1)}>+</button>
                    </div>
                    <button className="ff-del" onClick={() => removeExercise(selDay, i)}>{Ic.close(15, '#8a8a90')}</button>
                  </div>
                </div>
              ))}
              <button className="ff-btn ff-btn-ghost" style={{ marginTop: 12 }} onClick={() => openAdd(selDay)}>
                + Oefening toevoegen
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
