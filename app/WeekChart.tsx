import { useState } from 'react';
import { DAYS_SHORT } from '../data/constants';
import { dateKey, dayTotal, hasFood } from '../data/nutrition';
import type { Macros, Store } from '../types';

type Metric = 'kcal' | 'protein' | 'carbs' | 'fat';

const METRICS: { id: Metric; label: string; color: string; unit: string }[] = [
  { id: 'kcal', label: 'kcal', color: 'var(--ff-amber)', unit: '' },
  { id: 'protein', label: 'Eiwit', color: 'var(--ff-protein)', unit: 'g' },
  { id: 'carbs', label: 'Koolh.', color: 'var(--ff-carb)', unit: 'g' },
  { id: 'fat', label: 'Vet', color: 'var(--ff-fat)', unit: 'g' },
];

interface Bar {
  label: string;
  value: number;
  logged: boolean;
  today: boolean;
}

// Last 7 days of intake as vertical bars, switchable between kcal and each macro.
export function WeekChart({ store, goals }: { store: Store; goals: Macros }) {
  const [metric, setMetric] = useState<Metric>('kcal');
  const cfg = METRICS.find((m) => m.id === metric)!;
  const goal = goals[metric];

  const today = new Date();
  const bars: Bar[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const day = store.nutrition?.[dateKey(d)];
    const logged = hasFood(day);
    bars.push({
      label: DAYS_SHORT[(d.getDay() + 6) % 7],
      value: logged ? Math.round(dayTotal(day!)[metric]) : 0,
      logged,
      today: i === 0,
    });
  }

  const maxVal = Math.max(goal, ...bars.map((b) => b.value));
  const scale = Math.max(1, maxVal * 1.15);
  const goalPct = (goal / scale) * 100;
  const goalLabel = `doel ${goal}${cfg.unit ? ' ' + cfg.unit : ''}`;

  return (
    <div className="ff-chartcard">
      <div className="ff-seg">
        {METRICS.map((m) => (
          <button
            key={m.id}
            className={'ff-seg-btn' + (m.id === metric ? ' on' : '')}
            style={m.id === metric ? { color: m.color } : undefined}
            onClick={() => setMetric(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="ff-wkchart-plot">
        {goal > 0 && (
          <div className="ff-wkchart-goal" style={{ bottom: `${goalPct}%`, borderTopColor: cfg.color }}>
            <span style={{ color: cfg.color }}>{goalLabel}</span>
          </div>
        )}
        {bars.map((b, i) => {
          const pct = (b.value / scale) * 100;
          return (
            <div key={i} className={'ff-wkcol' + (b.today ? ' today' : '')}>
              {b.logged && <div className="ff-wkval" style={{ bottom: `${pct}%` }}>{b.value}</div>}
              {b.logged ? (
                <div className="ff-wkfill" style={{ height: `${Math.max(pct, 2)}%`, background: cfg.color }} />
              ) : (
                <div className="ff-wkempty" />
              )}
            </div>
          );
        })}
      </div>
      <div className="ff-wkchart-x">
        {bars.map((b, i) => (
          <span key={i} className={b.today ? 'on' : ''}>{b.label}</span>
        ))}
      </div>
    </div>
  );
}
