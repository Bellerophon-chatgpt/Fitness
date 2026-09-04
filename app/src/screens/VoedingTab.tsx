import { useMemo, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { MacroRing } from '../components/MacroRing';
import { MacroBar } from '../components/MacroBar';
import { EditNum } from '../components/EditNum';
import { Ic } from '../components/Icons';
import { DAYS_LONG, MONTHS } from '../data/constants';
import {
  dateKey,
  DEFAULT_GOALS,
  emptyDay,
  hasFood,
  itemMacros,
  MEALS,
  MEAL_LABEL,
  mealTotal,
  dayTotal,
  dayMicros,
  hasMicros,
  shiftKey,
} from '../data/nutrition';
import { FoodPicker } from './FoodPicker';
import { activeGoals, estimateMaintenance, deriveMacros } from '../data/goals';
import type { Activity, FoodItem, Macros, MealId, Profile, Store } from '../types';

const WATER_GOAL = 2000; // ml

function dayLabel(offset: number, d: Date): string {
  const rel = offset === 0 ? 'Vandaag' : offset === -1 ? 'Gisteren' : offset === 1 ? 'Morgen' : DAYS_LONG[(d.getDay() + 6) % 7];
  return `${rel} · ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function VoedingTab({
  store,
  addFood,
  updateAmount,
  removeFood,
  saveGoalConfig,
  copyPreviousDay,
  addWater,
}: {
  store: Store;
  addFood: (dk: string, meal: MealId, item: FoodItem) => void;
  updateAmount: (dk: string, meal: MealId, id: string, amount: number) => void;
  removeFood: (dk: string, meal: MealId, id: string) => void;
  saveGoalConfig: (c: { mode: 'manual' | 'adaptive'; macroGoals: Macros; profile?: Profile; goalRate: number }) => void;
  copyPreviousDay: (dk: string) => void;
  addWater: (dk: string, deltaMl: number) => void;
}) {
  const [offset, setOffset] = useState(0);
  const [picker, setPicker] = useState<MealId | null>(null);
  const [editing, setEditing] = useState<{ meal: MealId; item: FoodItem } | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);

  const selDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  }, [offset]);
  const dk = dateKey(selDate);

  const day = store.nutrition?.[dk] ?? emptyDay();
  const goals = activeGoals(store).goals;
  const total = dayTotal(day);
  const dayEmpty = !hasFood(store.nutrition?.[dk]);
  const prevHasFood = hasFood(store.nutrition?.[shiftKey(dk, -1)]);

  return (
    <div className="ff">
      <div className="ff-body">
        <TopBar />

        <div className="ff-datenav">
          <button className="ff-x" onClick={() => setOffset((o) => o - 1)} aria-label="Vorige dag">
            <span style={{ transform: 'scaleX(-1)', display: 'flex' }}>{Ic.chev(18, 'currentColor')}</span>
          </button>
          <div className="ff-datenav-lab">{dayLabel(offset, selDate)}</div>
          <button
            className="ff-x"
            onClick={() => setOffset((o) => o + 1)}
            aria-label="Volgende dag"
            disabled={offset >= 0}
            style={offset >= 0 ? { opacity: 0.35 } : undefined}
          >
            {Ic.chev(18, 'currentColor')}
          </button>
        </div>

        <div className="ff-scroll">
          {/* daily summary */}
          <div className="ff-nsum" onClick={() => setGoalOpen(true)}>
            <MacroRing macros={total} kcalGoal={goals.kcal} />
            <div className="ff-nsum-legend">
              <MacroBar label="Koolhydraten" color="var(--ff-carb)" cur={total.carbs} goal={goals.carbs} />
              <MacroBar label="Eiwit" color="var(--ff-protein)" cur={total.protein} goal={goals.protein} />
              <MacroBar label="Vet" color="var(--ff-fat)" cur={total.fat} goal={goals.fat} />
            </div>
          </div>

          <div className="ff-remain">
            <RemainCell label="kcal" value={goals.kcal - total.kcal} color="var(--ff-amber)" />
            <RemainCell label="koolh." unit="g" value={goals.carbs - total.carbs} color="var(--ff-carb)" />
            <RemainCell label="eiwit" unit="g" value={goals.protein - total.protein} color="var(--ff-protein)" />
            <RemainCell label="vet" unit="g" value={goals.fat - total.fat} color="var(--ff-fat)" />
          </div>
          <div className="ff-remain-cap">{total.kcal <= goals.kcal ? 'Nog te gaan vandaag' : 'Boven je dagdoel'}</div>

          <div className="ff-water">
            <div className="ff-water-head">
              <div className="ff-water-val"><b>{store.water?.[dk] ?? 0}</b> / {WATER_GOAL} ml water</div>
              <div className="ff-water-btns">
                <button onClick={() => addWater(dk, -250)} aria-label="Minder water">−</button>
                <button onClick={() => addWater(dk, 250)}>+250</button>
                <button onClick={() => addWater(dk, 500)}>+500</button>
              </div>
            </div>
            <div className="ff-progress"><i style={{ width: Math.min(100, ((store.water?.[dk] ?? 0) / WATER_GOAL) * 100) + '%', background: 'var(--ff-water)' }} /></div>
          </div>

          {dayEmpty && prevHasFood && (
            <button className="ff-copy-btn" onClick={() => copyPreviousDay(dk)}>
              {Ic.copy(16)} Kopieer vorige dag
            </button>
          )}

          {/* meals */}
          {MEALS.map(([meal, label]) => {
            const items = day[meal];
            const mt = mealTotal(items);
            return (
              <div key={meal} className="ff-meal">
                <div className="ff-meal-head">
                  <span className="nm">{label}</span>
                  <span className="kc">{Ic.flame(13, 'var(--ff-faint)')} {mt.kcal} kcal</span>
                </div>
                {items.map((it) => {
                  const m = itemMacros(it);
                  return (
                    <div key={it.id} className="ff-fitem" onClick={() => setEditing({ meal, item: it })}>
                      <div style={{ minWidth: 0 }}>
                        <div className="ff-fitem-name">{it.name}</div>
                        <div className="ff-fitem-sub">
                          {it.amount} {it.unit}{it.brand ? ' · ' + it.brand : ''}
                        </div>
                      </div>
                      <div className="ff-fitem-macros">
                        <div className="kc">{m.kcal}</div>
                        <div className="mm">
                          <span style={{ color: 'var(--ff-carb)' }}>{m.carbs}</span>
                          <span style={{ color: 'var(--ff-protein)' }}>{m.protein}</span>
                          <span style={{ color: 'var(--ff-fat)' }}>{m.fat}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button className="ff-meal-add" onClick={() => setPicker(meal)}>
                  <span className="plus">+</span> Toevoegen
                </button>
              </div>
            );
          })}

          {hasMicros(day) && (() => {
            const mic = dayMicros(day);
            return (
              <>
                <div className="ff-sublabel" style={{ margin: '18px 0 8px' }}>Micronutriënten vandaag</div>
                <div className="ff-remain">
                  <div className="ff-remain-cell"><div className="v">{mic.fiber}g</div><div className="l">vezels</div></div>
                  <div className="ff-remain-cell"><div className="v">{mic.sugar}g</div><div className="l">suiker</div></div>
                  <div className="ff-remain-cell"><div className="v">{mic.satfat}g</div><div className="l">verz. vet</div></div>
                  <div className="ff-remain-cell"><div className="v">{mic.salt}g</div><div className="l">zout</div></div>
                </div>
              </>
            );
          })()}
          <div style={{ height: 8 }} />
        </div>
      </div>

      {picker && (
        <FoodPicker
          meal={picker}
          recents={store.recentFoods ?? []}
          onAdd={(item) => addFood(dk, picker, item)}
          onClose={() => setPicker(null)}
        />
      )}

      {editing && (
        <AmountSheet
          item={editing.item}
          mealLabel={MEAL_LABEL[editing.meal]}
          onSave={(amt) => {
            updateAmount(dk, editing.meal, editing.item.id, amt);
            setEditing(null);
          }}
          onRemove={() => {
            removeFood(dk, editing.meal, editing.item.id);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {goalOpen && (
        <GoalSheet store={store} onSave={(c) => { saveGoalConfig(c); setGoalOpen(false); }} onClose={() => setGoalOpen(false)} />
      )}
    </div>
  );
}

function RemainCell({ label, value, color, unit }: { label: string; value: number; color: string; unit?: string }) {
  const over = value < -0.5;
  const disp = Math.abs(Math.round(value));
  return (
    <div className="ff-remain-cell">
      <div className="v" style={{ color: over ? 'var(--ff-faint)' : color }}>{disp}{unit || ''}</div>
      <div className="l">{label}{over ? ' te veel' : ''}</div>
    </div>
  );
}

function AmountSheet({
  item,
  mealLabel,
  onSave,
  onRemove,
  onClose,
}: {
  item: FoodItem;
  mealLabel: string;
  onSave: (amt: number) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(item.amount);
  const m = itemMacros({ ...item, amount });
  return (
    <div className="ff-sheet-scrim" onClick={onClose}>
      <div className="ff-bottomsheet" onClick={(e) => e.stopPropagation()}>
        <div className="ff-sheet-grab" />
        <div className="ff-food-head" style={{ marginBottom: 4 }}>
          <div className="ff-food-name">{item.name}</div>
          <div className="ff-food-brand">{mealLabel}{item.brand ? ' · ' + item.brand : ''}</div>
        </div>

        <div className="ff-sublabel" style={{ margin: '14px 0 8px' }}>Hoeveelheid ({item.unit})</div>
        <div className="ff-stepper">
          <button className="ff-step-btn" onClick={() => setAmount((a) => Math.max(1, Math.round(a - 10)))}>−</button>
          <EditNum value={amount} unit={item.unit} round onCommit={(v) => setAmount(Math.max(1, v))} />
          <button className="ff-step-btn" onClick={() => setAmount((a) => Math.round(a + 10))}>+</button>
        </div>

        <div className="ff-macro-preview">
          <div className="mp kcal"><b>{m.kcal}</b><span>kcal</span></div>
          <div className="mp"><i style={{ background: 'var(--ff-carb)' }} /><b>{m.carbs}g</b><span>koolh.</span></div>
          <div className="mp"><i style={{ background: 'var(--ff-protein)' }} /><b>{m.protein}g</b><span>eiwit</span></div>
          <div className="mp"><i style={{ background: 'var(--ff-fat)' }} /><b>{m.fat}g</b><span>vet</span></div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="ff-del-btn" onClick={onRemove}>{Ic.trash(17)} Verwijderen</button>
          <button className="ff-btn ff-btn-primary" style={{ flex: 1 }} onClick={() => onSave(Math.max(1, Math.round(amount)))}>Opslaan</button>
        </div>
      </div>
    </div>
  );
}

const ACTIVITY_LABELS: [Activity, string][] = [
  ['low', 'Weinig'],
  ['medium', 'Licht'],
  ['high', 'Actief'],
  ['veryhigh', 'Zeer'],
];

function GoalSheet({
  store,
  onSave,
  onClose,
}: {
  store: Store;
  onSave: (c: { mode: 'manual' | 'adaptive'; macroGoals: Macros; profile?: Profile; goalRate: number }) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'manual' | 'adaptive'>(store.calorieMode ?? 'manual');
  const [g, setG] = useState<Macros>(store.macroGoals ?? DEFAULT_GOALS);
  const setMacro = (k: keyof Macros, v: number) => setG((p) => ({ ...p, [k]: Math.max(0, v) }));

  const [profile, setProfile] = useState<Profile>(store.profile ?? { sex: 'm', age: 30, heightCm: 180, activity: 'medium' });
  const setP = <K extends keyof Profile>(k: K, v: Profile[K]) => setProfile((p) => ({ ...p, [k]: v }));
  const [rate, setRate] = useState<number>(store.goalRate ?? 0);

  const currentKg = store.weightLog?.length ? store.weightLog[store.weightLog.length - 1].kg : null;

  // live preview for adaptive mode using the in-sheet profile/rate
  const previewStore: Store = { ...store, profile, calorieMode: 'adaptive', goalRate: rate };
  const est = estimateMaintenance(previewStore);
  const preview = est ? deriveMacros(est.tdee + (rate * 7700) / 7, currentKg) : null;

  const save = () => onSave({ mode, macroGoals: g, profile, goalRate: rate });

  return (
    <div className="ff-sheet-scrim" onClick={onClose}>
      <div className="ff-bottomsheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '86vh', overflowY: 'auto' }}>
        <div className="ff-sheet-grab" />
        <div className="ff-food-name" style={{ marginBottom: 2 }}>Dagdoelen</div>
        <div className="ff-food-brand">Handmatig instellen of automatisch laten berekenen</div>

        <div className="ff-seg" style={{ marginTop: 14 }}>
          <button className={'ff-seg-btn' + (mode === 'manual' ? ' on' : '')} onClick={() => setMode('manual')}>Handmatig</button>
          <button className={'ff-seg-btn' + (mode === 'adaptive' ? ' on' : '')} onClick={() => setMode('adaptive')}>Adaptief</button>
        </div>

        {mode === 'manual' ? (
          <div className="ff-macroform" style={{ marginTop: 16 }}>
            <div className="ff-macrofield"><EditNum value={g.kcal} unit="kcal" round onCommit={(v) => setMacro('kcal', v)} /></div>
            <div className="ff-macrofield"><EditNum value={g.carbs} unit="koolh. g" round onCommit={(v) => setMacro('carbs', v)} /></div>
            <div className="ff-macrofield"><EditNum value={g.protein} unit="eiwit g" round onCommit={(v) => setMacro('protein', v)} /></div>
            <div className="ff-macrofield"><EditNum value={g.fat} unit="vet g" round onCommit={(v) => setMacro('fat', v)} /></div>
          </div>
        ) : (
          <>
            <div className="ff-sublabel" style={{ margin: '16px 0 8px' }}>Doel</div>
            <div className="ff-seg">
              <button className={'ff-seg-btn' + (rate < 0 ? ' on' : '')} onClick={() => setRate(-0.4)}>Afvallen</button>
              <button className={'ff-seg-btn' + (rate === 0 ? ' on' : '')} onClick={() => setRate(0)}>Onderhoud</button>
              <button className={'ff-seg-btn' + (rate > 0 ? ' on' : '')} onClick={() => setRate(0.25)}>Aankomen</button>
            </div>
            {rate !== 0 && (
              <div className="ff-macroform" style={{ marginTop: 10, gridTemplateColumns: '1fr' }}>
                <div className="ff-macrofield"><EditNum value={Math.abs(rate)} unit="kg / week" onCommit={(v) => setRate((rate < 0 ? -1 : 1) * Math.abs(v))} /></div>
              </div>
            )}

            <div className="ff-sublabel" style={{ margin: '16px 0 8px' }}>Over jou</div>
            <div className="ff-seg">
              <button className={'ff-seg-btn' + (profile.sex === 'm' ? ' on' : '')} onClick={() => setP('sex', 'm')}>Man</button>
              <button className={'ff-seg-btn' + (profile.sex === 'f' ? ' on' : '')} onClick={() => setP('sex', 'f')}>Vrouw</button>
            </div>
            <div className="ff-macroform" style={{ marginTop: 10 }}>
              <div className="ff-macrofield"><EditNum value={profile.age} unit="jaar" round onCommit={(v) => setP('age', Math.max(1, v))} /></div>
              <div className="ff-macrofield"><EditNum value={profile.heightCm} unit="cm" round onCommit={(v) => setP('heightCm', Math.max(1, v))} /></div>
            </div>
            <div className="ff-sublabel" style={{ margin: '14px 0 8px' }}>Beweging</div>
            <div className="ff-seg">
              {ACTIVITY_LABELS.map(([a, lab]) => (
                <button key={a} className={'ff-seg-btn' + (profile.activity === a ? ' on' : '')} onClick={() => setP('activity', a)}>{lab}</button>
              ))}
            </div>

            <div className="ff-goalpreview">
              {preview && est ? (
                <>
                  <div className="ff-goalpreview-kcal">{preview.kcal}<span> kcal / dag</span></div>
                  <div className="ff-goalpreview-macros">
                    <span style={{ color: 'var(--ff-carb)' }}>{preview.carbs}g koolh.</span>
                    <span style={{ color: 'var(--ff-protein)' }}>{preview.protein}g eiwit</span>
                    <span style={{ color: 'var(--ff-fat)' }}>{preview.fat}g vet</span>
                  </div>
                  <div className="ff-goalpreview-note">
                    Onderhoud ≈ {est.tdee} kcal · {est.basis === 'data' ? 'op basis van je gewichtstrend en inname' : 'geschat met de Mifflin–St Jeor-formule'}
                  </div>
                </>
              ) : (
                <div className="ff-goalpreview-note">
                  {currentKg == null
                    ? 'Log eerst je gewicht in de Doelen-tab, dan kan ik een schatting maken.'
                    : 'Vul je gegevens in voor een schatting.'}
                </div>
              )}
            </div>
            <div className="ff-data-hint" style={{ marginTop: 8 }}>
              Zodra je een paar weken gewicht en voeding logt, stapt de schatting automatisch over van de formule naar je eigen data.
            </div>
          </>
        )}

        <button className="ff-btn ff-btn-primary" style={{ marginTop: 18 }} disabled={mode === 'adaptive' && !preview} onClick={save}>Opslaan</button>
      </div>
    </div>
  );
}
