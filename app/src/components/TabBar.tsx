import type { TabId } from '../types';
import { Ic } from './Icons';

const TABS: [TabId, string, (s?: number) => React.ReactNode][] = [
  ['training', 'Training', Ic.training],
  ['schema', 'Schema', Ic.schema],
  ['coaching', 'Coaching', Ic.coaching],
  ['doelen', 'Doelen', Ic.doelen],
];

export function TabBar({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  return (
    <div className="ff-tabs">
      {TABS.map(([id, label, icon]) => (
        <div key={id} className={'ff-tab' + (id === active ? ' on' : '')} onClick={() => onChange(id)}>
          {icon(22)}
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
