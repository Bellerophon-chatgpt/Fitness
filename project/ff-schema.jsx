// ff-schema.jsx — Schema management tab + quick-add picker overlay
const { useState: useStateS, useRef: useRefS } = React;

function SchemaTab({ store, selDay, setSelDay, setExerciseSets, removeExercise, moveExercise, openAdd }) {
  const day = store.days[selDay];
  const dots = daysWithEx(store);
  const listRef = useRefS(null);
  const drag = useRefS(null);
  const [dragIdx, setDragIdx] = useStateS(-1);
  const [dragY, setDragY] = useStateS(0);

  const onGripDown = (e, startIdx) => {
    e.preventDefault();
    const rows = [...listRef.current.querySelectorAll('.ff-srow')];
    drag.current = {
      idx: startIdx,
      pointerStart: e.clientY,
      rowTop: rows[startIdx].getBoundingClientRect().top,
    };
    setDragIdx(startIdx);
    setDragY(0);
    try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
  };
  const onGripMove = e => {
    if (!drag.current) return;
    const d = drag.current;
    setDragY(e.clientY - d.pointerStart);
    const rows = [...listRef.current.querySelectorAll('.ff-srow')];
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
      try { buzz(); } catch (err) {}
    }
  };
  const onGripUp = e => {
    drag.current = null;
    setDragIdx(-1);
    setDragY(0);
    try { e.target.releasePointerCapture(e.pointerId); } catch (err) {}
  };

  return (
    <div className="ff">
      <div className="ff-body">
        <Top />
        <div style={{ marginBottom: 14 }}>
          <div className="ff-label">Schema beheren</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <DayStrip sel={selDay} onSel={setSelDay} dotDays={dots} />
        </div>

        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 12 }}>
          <div className="ff-h1" style={{ fontSize: 20 }}>{DAYS_LONG[selDay]}</div>
          {day && <div className="ff-sublabel">{day.ex.length > 1 ? 'sleep ☰ om te ordenen' : day.tag}</div>}
        </div>

        <div className="ff-scroll" ref={listRef}>
          {!day || day.ex.length === 0 ? (
            <div className="ff-empty">
              Nog geen oefeningen.
              <div style={{ marginTop: 14 }}>
                <button className="ff-btn ff-btn-primary" style={{ height: 48, fontSize: 12 }} onClick={() => openAdd(selDay)}>+ Oefening toevoegen</button>
              </div>
            </div>
          ) : (
            <>
              {day.ex.map((e, i) => (
                <div key={e.name + '_' + i}
                  className={'ff-srow' + (dragIdx === i ? ' dragging' : '')}
                  style={dragIdx === i ? { transform: `translateY(${dragY}px)` } : null}>
                  <div className="ff-grip"
                    onPointerDown={ev => onGripDown(ev, i)}
                    onPointerMove={onGripMove}
                    onPointerUp={onGripUp}
                    onPointerCancel={onGripUp}>
                    {Ic.grip(20)}
                  </div>
                  <div className="ff-srow-name">{e.name}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div className="ff-mini">
                      <button onClick={() => setExerciseSets(selDay, i, e.sets.length - 1)}>−</button>
                      <div className="v">{e.sets.length} set{e.sets.length !== 1 ? 's' : ''}</div>
                      <button onClick={() => setExerciseSets(selDay, i, e.sets.length + 1)}>+</button>
                    </div>
                    <button className="ff-del" onClick={() => removeExercise(selDay, i)}>{Ic.close(15, '#8a8a90')}</button>
                  </div>
                </div>
              ))}
              <button className="ff-btn ff-btn-ghost" style={{ marginTop: 12 }} onClick={() => openAdd(selDay)}>+ Oefening toevoegen</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Quick-add picker overlay ─────────────────────────────────
function AddPicker({ store, day, addExercise, onClose }) {
  const [q, setQ] = useStateS('');
  const existing = new Set((store.days[day]?.ex || []).map(e => e.name.toLowerCase()));
  const ql = q.trim().toLowerCase();
  const matches = RECENTS.filter(r => r.toLowerCase().includes(ql));
  const isNew = ql && !RECENTS.some(r => r.toLowerCase() === ql);

  return (
    <div className="ff-overlay">
      <div className="ff-ohead">
        <button className="ff-x" onClick={onClose}>{Ic.close(18)}</button>
        <div className="ff-sublabel">Oefening toevoegen · {DAYS_SHORT[day]}</div>
        <div className="ff-x" style={{ borderColor:'transparent', background:'transparent' }} />
      </div>
      <div className="ff-obody">
        <input className="ff-search" placeholder="Zoek of typ een nieuwe oefening…" value={q} onChange={e => setQ(e.target.value)} autoFocus />

        {isNew && (
          <div className="ff-chip" style={{ marginTop: 12, justifyContent:'center', borderColor:'var(--ff-amber-dim)' }} onClick={() => { addExercise(day, q.trim()); setQ(''); }}>
            <span className="plus">+</span> Voeg "{q.trim()}" toe
          </div>
        )}

        <div className="ff-sublabel" style={{ margin:'18px 0 2px' }}>Recent gebruikt — tik om toe te voegen</div>
        <div className="ff-chips">
          {matches.map(r => {
            const added = existing.has(r.toLowerCase());
            return (
              <div key={r} className={'ff-chip' + (added ? ' added' : '')} onClick={() => !added && addExercise(day, r)}>
                <span className="plus">{added ? Ic.check(12) : '+'}</span>{r}
              </div>
            );
          })}
          {matches.length === 0 && !isNew && (
            <div style={{ color:'var(--ff-faint)', fontSize:13, fontFamily:'var(--ff-mono)', padding:'8px 2px' }}>Geen resultaten</div>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 20 }} />
        <button className="ff-btn ff-btn-primary" onClick={onClose}>Klaar</button>
      </div>
    </div>
  );
}

Object.assign(window, { SchemaTab, AddPicker });
