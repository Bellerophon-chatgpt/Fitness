// ff-ui.jsx — shared store, icons, constants, small components
const { useState, useEffect, useRef } = React;

// ── constants ────────────────────────────────────────────────
const DAYS_SHORT = ['MA','DI','WO','DO','VR','ZA','ZO'];
const DAYS_LONG  = ['Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag','Zondag'];
const MONTHS = ['JAN','FEB','MRT','APR','MEI','JUN','JUL','AUG','SEP','OKT','NOV','DEC'];
const RECENTS = ['Bench Press','Squat','Deadlift','Pull-up','Overhead Press','Barbell Row','Lat Pulldown','Bicep Curl','Romanian Deadlift','Leg Press','Lunges','Dips','Cable Fly','Triceps Pushdown'];

// today, with Monday = 0
const TODAY = (new Date().getDay() + 6) % 7;
function todayLabel() {
  const d = new Date();
  return `${DAYS_SHORT[TODAY]} · ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const mkSets = (n, w, r) => Array.from({ length: n }, () => ({ reps: r, weight: w, done: false, last: { weight: w, reps: r } }));

// ── feedback: short beep + vibration (for rest-timer end) ────
let _actx;
function ping() {
  try {
    _actx = _actx || new (window.AudioContext || window.webkitAudioContext)();
    if (_actx.state === 'suspended') _actx.resume();
    const o = _actx.createOscillator(), g = _actx.createGain();
    o.type = 'sine'; o.frequency.value = 880;
    o.connect(g); g.connect(_actx.destination);
    const t0 = _actx.currentTime;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
    o.start(t0); o.stop(t0 + 0.47);
  } catch (e) {}
}
function buzz() { try { if (navigator.vibrate) navigator.vibrate([140, 70, 140]); } catch (e) {} }

const SEED = {
  0: { title: 'Borst & Triceps', tag: 'Duwen', ex: [
    { name: 'Bench Press', sets: mkSets(3, 60, 10) },
    { name: 'Incline Dumbbell', sets: mkSets(3, 22, 12) },
    { name: 'Cable Fly', sets: mkSets(3, 15, 15) },
    { name: 'Triceps Pushdown', sets: mkSets(3, 25, 12) },
  ]},
  2: { title: 'Rug & Biceps', tag: 'Trekken', ex: [
    { name: 'Deadlift', sets: mkSets(3, 100, 5) },
    { name: 'Pull-up', sets: mkSets(3, 0, 8) },
    { name: 'Barbell Row', sets: mkSets(3, 50, 10) },
    { name: 'Bicep Curl', sets: mkSets(3, 14, 12) },
  ]},
  4: { title: 'Benen', tag: 'Onderlijf', ex: [
    { name: 'Squat', sets: mkSets(4, 80, 8) },
    { name: 'Romanian Deadlift', sets: mkSets(3, 70, 10) },
    { name: 'Leg Press', sets: mkSets(3, 140, 12) },
    { name: 'Lunges', sets: mkSets(3, 20, 12) },
  ]},
};

// ── store (localStorage) ─────────────────────────────────────
const FF_KEY = 'ff_proto_v3';
function loadStore() {
  try { const s = JSON.parse(localStorage.getItem(FF_KEY)); if (s && s.days) return s; } catch (e) {}
  return { days: JSON.parse(JSON.stringify(SEED)) };
}
function saveStore(s) { try { localStorage.setItem(FF_KEY, JSON.stringify(s)); } catch (e) {} }

// ── icons ────────────────────────────────────────────────────
const Ic = {
  training: (s=22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/></svg>,
  schema:   (s=22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 7h14M5 12h14M5 17h9"/></svg>,
  coaching: (s=22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v11H9l-4 3v-3H4z"/></svg>,
  doelen:   (s=22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/></svg>,
  chev: (s=20, c="#5a5a60") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>,
  grip: (s=20, c="#82828a") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M8 7h.01M16 7h.01M8 12h.01M16 12h.01M8 17h.01M16 17h.01"/></svg>,
  close: (s=18, c="#ededee") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  sun: (s=17) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>,
  moon: (s=17) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 119.5 4 6.3 6.3 0 0020 14.5z"/></svg>,
  check: (s=15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#1a1304" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>,
};

// theme context — provided by App, consumed by Top's toggle
const ThemeCtx = React.createContext({ theme: 'dark', toggle: () => {} });

// ── shared bits ──────────────────────────────────────────────
function Top({ date }) {
  const { theme, toggle } = React.useContext(ThemeCtx);
  return (
    <div className="ff-top">
      <div className="ff-wordmark">FORM<b>&amp;</b>FUEL</div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div className="ff-date">{date || todayLabel()}</div>
        <button className="ff-tt" onClick={toggle} aria-label="Wissel thema">
          {theme === 'dark' ? Ic.sun(16) : Ic.moon(16)}
        </button>
      </div>
    </div>
  );
}

function TabBar({ active, onChange }) {
  const tabs = [['training','Training',Ic.training],['schema','Schema',Ic.schema],['coaching','Coaching',Ic.coaching],['doelen','Doelen',Ic.doelen]];
  return (
    <div className="ff-tabs">
      {tabs.map(([id, label, icon]) => (
        <div key={id} className={'ff-tab' + (id === active ? ' on' : '')} onClick={() => onChange(id)}>
          {icon(22)}<span>{label}</span>
        </div>
      ))}
    </div>
  );
}

// day strip; `dotDays` = set of indices that have exercises
function DayStrip({ sel, onSel, dotDays }) {
  return (
    <div className="ff-days">
      {DAYS_SHORT.map((d, i) => (
        <div key={d}
          className={'ff-day' + (i === sel ? ' on' : '') + (i === TODAY ? ' today' : '')}
          onClick={() => onSel(i)}>
          {d}{dotDays && dotDays.has(i) && <span className="pip" />}
        </div>
      ))}
    </div>
  );
}

const daysWithEx = store => new Set(Object.keys(store.days).filter(k => store.days[k] && store.days[k].ex.length).map(Number));

Object.assign(window, {
  DAYS_SHORT, DAYS_LONG, RECENTS, TODAY, todayLabel, mkSets, SEED,
  loadStore, saveStore, Ic, Top, TabBar, DayStrip, daysWithEx, ping, buzz, ThemeCtx,
});
