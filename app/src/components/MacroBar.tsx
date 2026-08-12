// A labelled progress bar: current macro value against its daily goal.
export function MacroBar({ label, color, cur, goal }: { label: string; color: string; cur: number; goal: number }) {
  const pct = goal > 0 ? Math.min(100, Math.round((cur / goal) * 100)) : 0;
  return (
    <div className="ff-mbar">
      <div className="ff-mbar-top">
        <span><i style={{ background: color }} />{label}</span>
        <span className="v"><b>{Math.round(cur)}</b> / {goal} g</span>
      </div>
      <div className="ff-progress"><i style={{ width: pct + '%', background: color }} /></div>
    </div>
  );
}
