interface Point { date: string; value: number }

// Compact line chart of a dated series, y-range fitted to the data.
export function ProgressChart({ points, unit, color = 'var(--ff-amber)' }: { points: Point[]; unit?: string; color?: string }) {
  if (points.length === 0) return <div className="ff-empty">Nog geen data.</div>;

  const W = 320;
  const H = 150;
  const padX = 10;
  const padTop = 16;
  const padBottom = 22;

  const vals = points.map((p) => p.value);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = Math.max(1, hi - lo);
  const min = lo - span * 0.15;
  const max = hi + span * 0.2;

  const x = (i: number) => padX + (points.length === 1 ? (W - 2 * padX) / 2 : (i / (points.length - 1)) * (W - 2 * padX));
  const y = (v: number) => padTop + (1 - (v - min) / (max - min)) * (H - padTop - padBottom);

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  const shortDate = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(d)}/${Number(m)}`; };

  return (
    <svg className="ff-pchart" viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none">
      {points.length > 1 && <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r={i === points.length - 1 ? 3.5 : 2.2} fill={color} />
      ))}
      <text x={x(points.length - 1)} y={y(last.value) - 8} textAnchor="end" className="ff-pchart-val" fill={color}>
        {Math.round(last.value)}{unit ? ' ' + unit : ''}
      </text>
      <text x={padX} y={H - 6} className="ff-pchart-ax">{shortDate(points[0].date)}</text>
      {points.length > 1 && <text x={W - padX} y={H - 6} textAnchor="end" className="ff-pchart-ax">{shortDate(last.date)}</text>}
    </svg>
  );
}
