import type { Macros } from '../types';

// Donut showing how the day's calories split across carbs / protein / fat.
// Segments are sized by calorie contribution (carbs & protein 4 kcal/g, fat 9).
export function MacroRing({ macros, size = 96, kcalGoal }: { macros: Macros; size?: number; kcalGoal?: number }) {
  const cK = macros.carbs * 4;
  const pK = macros.protein * 4;
  const fK = macros.fat * 9;
  const total = cK + pK + fK;

  const r = 42;
  const c = 2 * Math.PI * r;
  const segs = total > 0 ? [
    { key: 'carb', frac: cK / total, color: 'var(--ff-carb)' },
    { key: 'protein', frac: pK / total, color: 'var(--ff-protein)' },
    { key: 'fat', frac: fK / total, color: 'var(--ff-fat)' },
  ] : [];

  let offset = 0;
  const gap = total > 0 ? 1.5 : 0; // small visual gap between segments (in deg-equivalent length)

  return (
    <div className="ff-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--ff-line-soft)" strokeWidth="10" />
        {segs.map((s) => {
          const len = Math.max(0, s.frac * c - gap);
          const el = (
            <circle
              key={s.key}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
            />
          );
          offset += s.frac * c;
          return el;
        })}
      </svg>
      <div className="ff-ring-mid">
        <div className="kc">{Math.round(macros.kcal)}</div>
        <div className="u">{kcalGoal ? `/ ${kcalGoal}` : 'kcal'}</div>
      </div>
    </div>
  );
}
