import { DAYS_SHORT, TODAY } from '../data/constants';

export function DayStrip({
  sel,
  onSel,
  dotDays,
}: {
  sel: number;
  onSel: (i: number) => void;
  dotDays?: Set<number>;
}) {
  return (
    <div className="ff-days">
      {DAYS_SHORT.map((d, i) => (
        <div
          key={d}
          className={'ff-day' + (i === sel ? ' on' : '') + (i === TODAY ? ' today' : '')}
          onClick={() => onSel(i)}
        >
          {d}
          {dotDays && dotDays.has(i) && <span className="pip" />}
        </div>
      ))}
    </div>
  );
}
