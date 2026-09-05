export const Ic = {
  training: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" />
    </svg>
  ),
  schema: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 7h14M5 12h14M5 17h9" />
    </svg>
  ),
  coaching: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16v11H9l-4 3v-3H4z" />
    </svg>
  ),
  doelen: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  ),
  chev: (s = 20, c = '#5a5a60') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  grip: (s = 20, c = '#82828a') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M8 7h.01M16 7h.01M8 12h.01M16 12h.01M8 17h.01M16 17h.01" />
    </svg>
  ),
  close: (s = 18, c = '#ededee') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  sun: (s = 17) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  moon: (s = 17) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A8 8 0 119.5 4 6.3 6.3 0 0020 14.5z" />
    </svg>
  ),
  cloudOff: (s = 15) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2l20 20" />
      <path d="M9.5 5.5A5 5 0 0119 9a4 4 0 01-.4 8H17M5.5 8.1A4 4 0 006 16h3" />
    </svg>
  ),
  check: (s = 15) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#1a1304" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12l5 5L20 6" />
    </svg>
  ),
  voeding: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v7M8 3v7M5 10a3 3 0 003 0M6.5 10v11M15 3c-1.5 1.5-2 4-2 6 0 2 1 3 2.5 3s2.5-1 2.5-3c0-2-.5-4.5-3-6zM15.5 12v9" />
    </svg>
  ),
  barcode: (s = 20, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5v14M7 5v14M11 5v14M14 5v14M18 5v14M21 5v14" />
    </svg>
  ),
  flame: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c1 3 4 4.5 4 8a4 4 0 01-8 0c0-1.2.4-2 1-3 .2 1 .8 1.6 1.6 1.8C10 8 11 5.5 12 3z" />
    </svg>
  ),
  camera: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8a2 2 0 012-2h2l1.5-2h7L17 6h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <circle cx="12" cy="12.5" r="3.2" />
    </svg>
  ),
  search: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  ),
  trash: (s = 17, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    </svg>
  ),
  copy: (s = 16, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5 15V5a2 2 0 012-2h8" />
    </svg>
  ),
  drop: (s = 15, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke="none">
      <path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z" />
    </svg>
  ),
};
