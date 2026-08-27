import type { WeightEntry } from '../types';

// Compact line chart of recent bodyweight, with an optional dashed goal line.
// Y-range is fitted to the data (weight moves in a narrow band), not zero-based.
export function WeightChart({ entries, goal }: { entries: WeightEntry[]; goal?: number }) {
  const data = entries.slice(-30);
  if (data.length === 0) return null;

  const W = 300;
  const H = 110;
  const padX = 8;
  const padY = 12;

  const kgs = data.map((d) => d.kg);
  const lo = Math.min(...kgs, goal ?? Infinity);
  const hi = Math.max(...kgs, goal ?? -Infinity);
  const span = Math.max(1, hi - lo);
  const min = lo - span * 0.25;
  const max = hi + span * 0.25;

  const x = (i: number) => padX + (data.length === 1 ? (W - 2 * padX) / 2 : (i / (data.length - 1)) * (W - 2 * padX));
  const y = (kg: number) => padY + (1 - (kg - min) / (max - min)) * (H - 2 * padY);

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.kg).toFixed(1)}`).join(' ');
  const last = data[data.length - 1];
  const goalY = goal ? y(goal) : null;

  return (
    <svg className="ff-wchart" viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none">
      {goalY !== null && (
        <line x1={padX} y1={goalY} x2={W - padX} y2={goalY} stroke="var(--ff-muted)" strokeWidth="1" strokeDasharray="4 4" />
      )}
      {data.length > 1 && <path d={line} fill="none" stroke="var(--ff-amber)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.kg)} r={i === data.length - 1 ? 3.5 : 2} fill="var(--ff-amber)" />
      ))}
      <text x={x(data.length - 1)} y={y(last.kg) - 8} textAnchor="end" className="ff-wchart-val">{last.kg}</text>
    </svg>
  );
}
