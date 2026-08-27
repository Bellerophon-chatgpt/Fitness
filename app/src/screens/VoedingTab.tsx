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
  shiftKey,
} from '../data/nutrition';
import { FoodPicker } from './FoodPicker';
import type { FoodItem, Macros, MealId, Store } from '../types';

function dayLabel(offset: number, d: Date): string {
  const rel = offset === 0 ? 'Vandaag' : offset === -1 ? 'Gisteren' : offset === 1 ? 'Morgen' : DAYS_LONG[(d.getDay() + 6) % 7];
  return `${rel} · ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function VoedingTab({
  store,
  addFood,
  updateAmount,
  removeFood,
  setGoals,
  copyPreviousDay,
}: {
  store: Store;
  addFood: (dk: string, meal: MealId, item: FoodItem) => void;
  updateAmount: (dk: string, meal: MealId, id: string, amount: number) => void;
  removeFood: (dk: string, meal: MealId, id: string) => void;
  setGoals: (g: Macros) => void;
  copyPreviousDay: (dk: string) => void;
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
  const goals = store.macroGoals ?? DEFAULT_GOALS;
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
        <GoalSheet goals={goals} onSave={(g) => { setGoals(g); setGoalOpen(false); }} onClose={() => setGoalOpen(false)} />
      )}
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

function GoalSheet({ goals, onSave, onClose }: { goals: Macros; onSave: (g: Macros) => void; onClose: () => void }) {
  const [g, setG] = useState<Macros>(goals);
  const set = (k: keyof Macros, v: number) => setG((p) => ({ ...p, [k]: Math.max(0, v) }));
  return (
    <div className="ff-sheet-scrim" onClick={onClose}>
      <div className="ff-bottomsheet" onClick={(e) => e.stopPropagation()}>
        <div className="ff-sheet-grab" />
        <div className="ff-food-name" style={{ marginBottom: 2 }}>Dagdoelen</div>
        <div className="ff-food-brand">Stel je streefwaarden in</div>
        <div className="ff-macroform" style={{ marginTop: 16 }}>
          <div className="ff-macrofield"><EditNum value={g.kcal} unit="kcal" round onCommit={(v) => set('kcal', v)} /></div>
          <div className="ff-macrofield"><EditNum value={g.carbs} unit="koolh. g" round onCommit={(v) => set('carbs', v)} /></div>
          <div className="ff-macrofield"><EditNum value={g.protein} unit="eiwit g" round onCommit={(v) => set('protein', v)} /></div>
          <div className="ff-macrofield"><EditNum value={g.fat} unit="vet g" round onCommit={(v) => set('fat', v)} /></div>
        </div>
        <button className="ff-btn ff-btn-primary" style={{ marginTop: 18 }} onClick={() => onSave(g)}>Opslaan</button>
      </div>
    </div>
  );
}
