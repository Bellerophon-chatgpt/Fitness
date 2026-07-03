import { todayLabel } from '../data/constants';
import { useSync } from '../data/SyncContext';
import { useTheme } from '../theme/ThemeContext';
import { Ic } from './Icons';

export function TopBar({ date }: { date?: string }) {
  const { theme, toggle } = useTheme();
  const { offline, syncEnabled } = useSync();
  return (
    <div className="ff-top">
      <div className="ff-wordmark">
        FORM<b>&amp;</b>FUEL
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {syncEnabled && offline && (
          <span className="ff-sync-offline" title="Offline — wijzigingen worden gesynchroniseerd zodra je weer verbinding hebt">
            {Ic.cloudOff(15)}
          </span>
        )}
        <div className="ff-date">{date || todayLabel()}</div>
        <button className="ff-tt" onClick={toggle} aria-label="Wissel thema">
          {theme === 'dark' ? Ic.sun(16) : Ic.moon(16)}
        </button>
      </div>
    </div>
  );
}
