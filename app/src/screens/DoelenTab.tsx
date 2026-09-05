import { useRef, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { MacroRing } from '../components/MacroRing';
import { MacroBar } from '../components/MacroBar';
import { WeekChart } from '../components/WeekChart';
import { WeightChart } from '../components/WeightChart';
import { EditNum } from '../components/EditNum';
import { Ic } from '../components/Icons';
import { dateKey, dayTotal, hasFood, newId, ZERO } from '../data/nutrition';
import { activeGoals } from '../data/goals';
import { currentWeekDots, daysSinceLastSession, sessionsThisMonth, weekStreak } from '../data/training';
import { DAYS_SHORT, MONTHS, TODAY } from '../data/constants';
import type { Macros, StrengthGoal, Store } from '../types';

const DEFAULT_STRENGTH: StrengthGoal[] = [
  { id: 'bench', name: 'Bench Press · 1RM', cur: 72, target: 80, unit: 'kg' },
  { id: 'squat', name: 'Squat · 1RM', cur: 96, target: 120, unit: 'kg' },
];

function fmtWDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS_SHORT[(dt.getDay() + 6) % 7].toLowerCase()} ${d} ${MONTHS[m - 1]}`;
}

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

export function DoelenTab({
  store,
  email,
  onSignOut,
  logWeight,
  setWeightGoal,
  setStrengthGoals,
  onImport,
}: {
  store: Store;
  email?: string | null;
  onSignOut?: () => void;
  logWeight: (kg: number) => void;
  setWeightGoal: (kg: number) => void;
  setStrengthGoals: (list: StrengthGoal[]) => void;
  onImport: (s: Store) => void;
}) {
  const goals = activeGoals(store).goals;
  const { avg, loggedDays } = weeklyAverage(store);

  // real training stats from logged sessions
  const monthSessions = sessionsThisMonth(store.sessions);
  const streak = weekStreak(store.sessions);
  const dots = currentWeekDots(store.sessions);
  const sinceLast = daysSinceLastSession(store.sessions);

  // bodyweight
  const weightLog = store.weightLog ?? [];
  const current = weightLog.length ? weightLog[weightLog.length - 1].kg : null;
  const wGoal = store.weightGoal;
  const [w, setW] = useState<number>(current ?? 80);
  const delta = current != null && wGoal != null ? Math.round((current - wGoal) * 10) / 10 : null;

  // strength goals (editable)
  const strength = store.strengthGoals ?? DEFAULT_STRENGTH;
  const [editSg, setEditSg] = useState<StrengthGoal | 'new' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formfuel-backup-${dateKey(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Store;
      if (!parsed || typeof parsed !== 'object' || !parsed.days) {
        alert('Dit lijkt geen geldige FORM&FUEL back-up.');
        return;
      }
      if (confirm('Dit vervangt al je huidige gegevens (training en voeding) door de back-up. Doorgaan?')) {
        onImport(parsed);
      }
    } catch {
      alert('Kon het bestand niet lezen — is het een geldig back-up-bestand?');
    }
  };

  const saveStrength = (g: StrengthGoal) => {
    const exists = strength.some((s) => s.id === g.id);
    setStrengthGoals(exists ? strength.map((s) => (s.id === g.id ? g : s)) : [...strength, g]);
    setEditSg(null);
  };
  const removeStrength = (id: string) => {
    setStrengthGoals(strength.filter((s) => s.id !== id));
    setEditSg(null);
  };

  return (
    <div className="ff">
      <div className="ff-body">
        <TopBar />
        <div style={{ marginBottom: 16 }}>
          <div className="ff-label">Doelen</div>
          <div className="ff-h1" style={{ fontSize: 22 }}>Voortgang</div>
        </div>

        <div className="ff-statgrid" style={{ marginBottom: 12 }}>
          <div className="ff-stat"><div className="big">{monthSessions}</div><div className="lab">Sessies deze maand</div></div>
          <div className="ff-stat"><div className="big">{streak}</div><div className="lab">Weken streak</div></div>
        </div>
        <div className="ff-weekdots" style={{ marginBottom: 16 }}>
          <div className="ff-weekdots-row">
            {dots.map((on, i) => (
              <div key={i} className={'ff-weekdot' + (on ? ' on' : '') + (i === TODAY ? ' today' : '')}>
                <span>{DAYS_SHORT[i]}</span>
                <i />
              </div>
            ))}
          </div>
          <div className="ff-weekdots-cap">
            {sinceLast == null ? 'Nog geen training gelogd' : sinceLast === 0 ? 'Laatste training: vandaag' : sinceLast === 1 ? 'Laatste training: gisteren' : `Laatste training: ${sinceLast} dagen geleden`}
          </div>
        </div>

        <div className="ff-scroll">
          {(store.workoutLog?.length ?? 0) > 0 && (
            <>
              <div className="ff-sublabel" style={{ marginBottom: 10 }}>Laatste trainingen</div>
              {[...(store.workoutLog ?? [])].slice(-5).reverse().map((w) => (
                <div key={w.id} className="ff-wsession">
                  <div style={{ minWidth: 0 }}>
                    <div className="ff-wsession-title">{w.title || 'Training'}</div>
                    <div className="ff-wsession-sub">{fmtWDate(w.date)} · {w.exercises.length} oefening{w.exercises.length !== 1 ? 'en' : ''}</div>
                  </div>
                  <div className="ff-wsession-vol"><b>{Math.round(w.volume).toLocaleString('nl-NL')}</b><span>kg volume</span></div>
                </div>
              ))}
              <div style={{ height: 18 }} />
            </>
          )}

          {/* bodyweight */}
          <div className="ff-sublabel" style={{ marginBottom: 10 }}>Gewicht</div>
          <div className="ff-weight">
            <div className="ff-weight-head">
              <div className="ff-weight-now">{current != null ? current : '—'}<span> kg</span></div>
              {delta != null && (
                <div className="ff-weight-delta">{delta === 0 ? 'Doel bereikt' : `${Math.abs(delta)} kg ${delta > 0 ? 'boven' : 'onder'} doel`}</div>
              )}
            </div>
            {weightLog.length > 0 ? (
              <WeightChart entries={weightLog} goal={wGoal} />
            ) : (
              <div className="ff-empty" style={{ margin: '4px 0 14px' }}>Nog niet gewogen — vul hieronder je gewicht in.</div>
            )}
            <div className="ff-weight-row">
              <div className="ff-macrofield" style={{ flex: 1 }}><EditNum value={w} unit="kg vandaag" onCommit={setW} /></div>
              <button className="ff-btn ff-btn-primary" style={{ width: 128 }} onClick={() => logWeight(w)}>Opslaan</button>
            </div>
            <div className="ff-weight-goalrow">
              <span>Streefgewicht</span>
              <div className="ff-macrofield ff-weight-goalfield"><EditNum value={wGoal ?? current ?? 80} unit="kg" onCommit={setWeightGoal} /></div>
            </div>
          </div>

          {/* weekly nutrition */}
          <div className="ff-sublabel" style={{ margin: '20px 0 10px' }}>Voeding · deze week</div>
          {loggedDays > 0 ? (
            <WeekChart store={store} goals={goals} />
          ) : (
            <div className="ff-empty" style={{ marginBottom: 18 }}>Nog geen voeding gelogd deze week.</div>
          )}

          {loggedDays > 0 && (
            <>
              <div className="ff-sublabel" style={{ margin: '18px 0 10px' }}>Macro's · gemiddeld deze week</div>
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

          {/* strength goals */}
          <div className="ff-sublabel" style={{ marginBottom: 10 }}>Krachtdoelen</div>
          {strength.map((g) => {
            const pct = g.target > 0 ? Math.min(100, Math.round((g.cur / g.target) * 100)) : 0;
            const togo = Math.round((g.target - g.cur) * 10) / 10;
            return (
              <div key={g.id} className="ff-goal ff-goal-tap" onClick={() => setEditSg(g)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{g.name}</div>
                  <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, color: 'var(--ff-muted)' }}>
                    <b style={{ color: 'var(--ff-amber)' }}>{g.cur}</b> / {g.target} {g.unit}
                  </div>
                </div>
                <div className="ff-progress"><i style={{ width: pct + '%' }} /></div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ff-faint)', marginTop: 8, letterSpacing: '.1em' }}>
                  {togo > 0 ? `NOG ${togo} ${g.unit.toUpperCase()} TE GAAN` : 'DOEL BEREIKT'}
                </div>
              </div>
            );
          })}
          <button className="ff-btn ff-btn-ghost" style={{ marginTop: 4 }} onClick={() => setEditSg('new')}>
            + Doel toevoegen
          </button>

          <div className="ff-sublabel" style={{ margin: '22px 0 10px' }}>Gegevens</div>
          <div className="ff-data-row">
            <button className="ff-btn ff-btn-ghost" onClick={exportBackup}>{Ic.copy(16)} Exporteer back-up</button>
            <button className="ff-btn ff-btn-ghost" onClick={() => fileRef.current?.click()}>Importeer…</button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importBackup(f);
              e.target.value = '';
            }}
          />
          <div className="ff-data-hint">Bewaar af en toe een back-up als los bestand. Importeren vervangt je huidige gegevens.</div>

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

      {editSg && (
        <StrengthSheet
          goal={editSg === 'new' ? null : editSg}
          onSave={saveStrength}
          onRemove={editSg === 'new' ? undefined : () => removeStrength(editSg.id)}
          onClose={() => setEditSg(null)}
        />
      )}
    </div>
  );
}

function StrengthSheet({
  goal,
  onSave,
  onRemove,
  onClose,
}: {
  goal: StrengthGoal | null;
  onSave: (g: StrengthGoal) => void;
  onRemove?: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(goal?.name ?? '');
  const [cur, setCur] = useState(goal?.cur ?? 0);
  const [target, setTarget] = useState(goal?.target ?? 0);
  const [unit, setUnit] = useState(goal?.unit ?? 'kg');

  const save = () => {
    const n = name.trim();
    if (!n) return;
    onSave({ id: goal?.id ?? newId(), name: n, cur, target, unit: unit.trim() || 'kg' });
  };

  return (
    <div className="ff-sheet-scrim" onClick={onClose}>
      <div className="ff-bottomsheet" onClick={(e) => e.stopPropagation()}>
        <div className="ff-sheet-grab" />
        <div className="ff-food-name" style={{ marginBottom: 2 }}>{goal ? 'Doel aanpassen' : 'Nieuw doel'}</div>
        <div className="ff-food-brand">Bijv. een 1RM om naar toe te werken</div>

        <input
          className="ff-search"
          style={{ marginTop: 14 }}
          placeholder="Naam (bijv. Deadlift · 1RM)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="ff-macroform" style={{ marginTop: 12 }}>
          <div className="ff-macrofield"><EditNum value={cur} unit="huidig" onCommit={setCur} /></div>
          <div className="ff-macrofield"><EditNum value={target} unit="doel" onCommit={setTarget} /></div>
        </div>
        <input
          className="ff-search"
          style={{ marginTop: 12 }}
          placeholder="Eenheid (kg, reps, …)"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {onRemove && <button className="ff-del-btn" onClick={onRemove}>{Ic.trash(17)} Verwijderen</button>}
          <button className="ff-btn ff-btn-primary" style={{ flex: 1 }} disabled={!name.trim()} onClick={save}>Opslaan</button>
        </div>
      </div>
    </div>
  );
}
