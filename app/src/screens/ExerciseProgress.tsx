import { useState } from 'react';
import { Ic } from '../components/Icons';
import { ProgressChart } from '../components/ProgressChart';
import { bestE1RMHistory, exerciseHistory } from '../data/workout';
import type { WorkoutSession } from '../types';

type Metric = '1rm' | 'volume' | 'gewicht';

export function ExerciseProgress({
  name,
  workoutLog,
  onClose,
}: {
  name: string;
  workoutLog?: WorkoutSession[];
  onClose: () => void;
}) {
  const [metric, setMetric] = useState<Metric>('1rm');
  const history = exerciseHistory(workoutLog, name);
  const best = Math.round(bestE1RMHistory(workoutLog, name));

  const points = history.map((h) => ({
    date: h.date,
    value: metric === '1rm' ? h.e1rm : metric === 'volume' ? h.volume : h.topWeight,
  }));
  const unit = metric === 'volume' ? 'kg vol' : 'kg';

  return (
    <div className="ff-overlay">
      <div className="ff-ohead">
        <button className="ff-x" onClick={onClose}>{Ic.close(18)}</button>
        <div className="ff-sublabel">Voortgang</div>
        <div className="ff-x" style={{ borderColor: 'transparent', background: 'transparent' }} />
      </div>
      <div className="ff-obody">
        <div className="ff-h1" style={{ fontSize: 24, marginBottom: 2 }}>{name}</div>
        <div className="ff-food-brand">{history.length} sessie{history.length !== 1 ? 's' : ''} · beste ~{best} kg 1RM</div>

        <div className="ff-seg" style={{ marginTop: 16 }}>
          <button className={'ff-seg-btn' + (metric === '1rm' ? ' on' : '')} onClick={() => setMetric('1rm')}>Geschat 1RM</button>
          <button className={'ff-seg-btn' + (metric === 'volume' ? ' on' : '')} onClick={() => setMetric('volume')}>Volume</button>
          <button className={'ff-seg-btn' + (metric === 'gewicht' ? ' on' : '')} onClick={() => setMetric('gewicht')}>Gewicht</button>
        </div>

        <div className="ff-chartcard" style={{ marginTop: 14 }}>
          <ProgressChart points={points} unit={unit} />
        </div>

        <div className="ff-sublabel" style={{ margin: '18px 0 8px' }}>Alle sessies</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[...history].reverse().map((h, i) => (
            <div key={i} className="ff-prev">
              <div className="ff-prev-name">{fmt(h.date)}</div>
              <div className="ff-prev-meta">{h.topWeight} kg · ~{h.e1rm} kg 1RM · {Math.round(h.volume)} kg vol</div>
            </div>
          ))}
        </div>
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}

function fmt(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  return `${d} ${months[m - 1]} ${y}`;
}
