import { trendWeights } from '../data/goals';
import type { WeightEntry } from '../types';

// Bodyweight chart: faint raw measurements + a prominent smoothed trend line,
// with an optional dashed goal line. Y-range fitted to the data (not zero-based).
export function WeightChart({ entries, goal }: { entries: WeightEntry[]; goal?: number }) {
  const data = entries.slice(-30);
  if (data.length === 0) return null;
  const trend = trendWeights(data);

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

  const trendLine = trend.map((t, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(t).toFixed(1)}`).join(' ');
  const lastTrend = trend[trend.length - 1];
  const goalY = goal ? y(goal) : null;

  return (
    <svg className="ff-wchart" viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none">
      {goalY !== null && (
        <line x1={padX} y1={goalY} x2={W - padX} y2={goalY} stroke="var(--ff-muted)" strokeWidth="1" strokeDasharray="4 4" />
      )}
      {/* raw daily measurements, faint */}
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.kg)} r={1.8} fill="var(--ff-faint)" />
      ))}
      {/* smoothed trend line, prominent */}
      {data.length > 1 && <path d={trendLine} fill="none" stroke="var(--ff-amber)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
      <circle cx={x(trend.length - 1)} cy={y(lastTrend)} r={3.5} fill="var(--ff-amber)" />
      <text x={x(trend.length - 1)} y={y(lastTrend) - 8} textAnchor="end" className="ff-wchart-val">{lastTrend}</text>
    </svg>
  );
}
