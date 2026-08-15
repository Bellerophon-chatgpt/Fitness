import { TopBar } from '../components/TopBar';
import { MacroRing } from '../components/MacroRing';
import { MacroBar } from '../components/MacroBar';
import { WeekChart } from '../components/WeekChart';
import { dateKey, dayTotal, DEFAULT_GOALS, hasFood, ZERO } from '../data/nutrition';
import type { Macros, Store } from '../types';

const GOALS = [
  { name: 'Bench Press · 1RM', cur: 72, target: 80, unit: 'kg' },
  { name: 'Squat · 1RM', cur: 96, target: 120, unit: 'kg' },
  { name: 'Lichaamsgewicht', cur: 79, target: 84, unit: 'kg' },
];

// average the last 7 days' macros over the days that actually have a food log
function weeklyAverage(store: Store): { avg: Macros; loggedDays: number } {
  const today = new Date();
  const sum: Macros = { ...ZERO };
  let loggedDays = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const day = store.nutrition?.[dateKey(d)];
    if (hasFood(day)) {
      const t = dayTotal(day!);
      sum.kcal += t.kcal;
      sum.carbs += t.carbs;
      sum.protein += t.protein;
      sum.fat += t.fat;
      loggedDays++;
    }
  }
  if (!loggedDays) return { avg: { ...ZERO }, loggedDays: 0 };
  const r1 = (n: number) => Math.round((n / loggedDays) * 10) / 10;
  return {
    avg: { kcal: Math.round(sum.kcal / loggedDays), carbs: r1(sum.carbs), protein: r1(sum.protein), fat: r1(sum.fat) },
    loggedDays,
  };
}

export function DoelenTab({ store, email, onSignOut }: { store: Store; email?: string | null; onSignOut?: () => void }) {
  const goals = store.macroGoals ?? DEFAULT_GOALS;
  const { avg, loggedDays } = weeklyAverage(store);

  return (
    <div className="ff">
      <div className="ff-body">
        <TopBar />
        <div style={{ marginBottom: 16 }}>
          <div className="ff-label">Doelen</div>
          <div className="ff-h1" style={{ fontSize: 22 }}>Voortgang</div>
        </div>

        <div className="ff-statgrid" style={{ marginBottom: 16 }}>
          <div className="ff-stat"><div className="big">4</div><div className="lab">Weken streak</div></div>
          <div className="ff-stat"><div className="big">12</div><div className="lab">Sessies deze maand</div></div>
        </div>

        <div className="ff-scroll">
          <div className="ff-sublabel" style={{ marginBottom: 10 }}>
            Voeding · deze week
          </div>
          {loggedDays > 0 ? (
            <WeekChart store={store} goals={goals} />
          ) : (
            <div className="ff-empty" style={{ marginBottom: 18 }}>Nog geen voeding gelogd deze week.</div>
          )}

          {loggedDays > 0 && (
            <>
              <div className="ff-sublabel" style={{ margin: '18px 0 10px' }}>
                Macro's · gemiddeld deze week
              </div>
              <div className="ff-nsum" style={{ cursor: 'default', marginBottom: 8 }}>
                <MacroRing macros={avg} kcalGoal={goals.kcal} />
                <div className="ff-nsum-legend">
                  <MacroBar label="Koolhydraten" color="var(--ff-carb)" cur={avg.carbs} goal={goals.carbs} />
                  <MacroBar label="Eiwit" color="var(--ff-protein)" cur={avg.protein} goal={goals.protein} />
                  <MacroBar label="Vet" color="var(--ff-fat)" cur={avg.fat} goal={goals.fat} />
                </div>
              </div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ff-faint)', letterSpacing: '.1em', margin: '0 0 18px 2px' }}>
                GEMIDDELD OVER {loggedDays} LOGDAG{loggedDays === 1 ? '' : 'EN'}
              </div>
            </>
          )}

          <div className="ff-sublabel" style={{ marginBottom: 10 }}>Krachtdoelen</div>
          {GOALS.map((g, i) => {
            const pct = Math.min(100, Math.round((g.cur / g.target) * 100));
            return (
              <div key={i} className="ff-goal">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{g.name}</div>
                  <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, color: 'var(--ff-muted)' }}>
                    <b style={{ color: 'var(--ff-amber)' }}>{g.cur}</b> / {g.target} {g.unit}
                  </div>
                </div>
                <div className="ff-progress"><i style={{ width: pct + '%' }} /></div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ff-faint)', marginTop: 8, letterSpacing: '.1em' }}>
                  NOG {g.target - g.cur} {g.unit.toUpperCase()} TE GAAN
                </div>
              </div>
            );
          })}

          {(email || onSignOut) && (
            <>
              <div className="ff-sublabel" style={{ margin: '22px 0 10px' }}>Account</div>
              <div className="ff-account">
                <div style={{ minWidth: 0 }}>
                  <div className="ff-account-state">{email ? 'Gesynchroniseerd' : 'Alleen dit apparaat'}</div>
                  {email && <div className="ff-account-email">{email}</div>}
                </div>
                {onSignOut && <button className="ff-account-out" onClick={onSignOut}>Uitloggen</button>}
              </div>
            </>
          )}
          <div style={{ height: 8 }} />
        </div>
      </div>
    </div>
  );
}
