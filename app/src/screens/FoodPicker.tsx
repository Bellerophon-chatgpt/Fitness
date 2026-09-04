import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Ic } from '../components/Icons';
import { EditNum } from '../components/EditNum';
import {
  COMMON_FOODS,
  type FoodCandidate,
  lookupBarcode,
  MEAL_LABEL,
  newId,
  recentToCandidate,
  scale,
  searchFoods,
} from '../data/nutrition';
import type { FoodItem, MealId, RecentFood } from '../types';

const BarcodeScanner = lazy(() => import('./BarcodeScanner'));

type Step = 'browse' | 'scan' | 'detail';

const blankDraft = (barcode?: string): FoodCandidate => ({
  name: '',
  per100: { kcal: 0, carbs: 0, protein: 0, fat: 0 },
  unit: 'g',
  defaultAmount: 100,
  barcode,
});

export function FoodPicker({
  meal,
  recents,
  onAdd,
  onClose,
}: {
  meal: MealId;
  recents: RecentFood[];
  onAdd: (item: FoodItem) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>('browse');
  const [q, setQ] = useState('');
  const [online, setOnline] = useState<FoodCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [offline, setOffline] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);

  // detail step
  const [cand, setCand] = useState<FoodCandidate | null>(null);
  const [amount, setAmount] = useState(100);
  const [custom, setCustom] = useState(false);

  const ql = q.trim().toLowerCase();
  const match = (name: string, brand?: string) =>
    name.toLowerCase().includes(ql) || (brand || '').toLowerCase().includes(ql);
  const recentCands = (ql ? recents.filter((r) => match(r.name, r.brand)) : recents)
    .slice(0, 8)
    .map(recentToCandidate);
  const localMatches = ql ? COMMON_FOODS.filter((f) => match(f.name, f.brand)) : COMMON_FOODS;

  // debounced Open Food Facts text search
  const reqId = useRef(0);
  useEffect(() => {
    if (ql.length < 2) {
      setOnline([]);
      setSearching(false);
      return;
    }
    const id = ++reqId.current;
    setSearching(true);
    const t = setTimeout(() => {
      searchFoods(ql).then((res) => {
        if (id === reqId.current) {
          setOnline(res);
          setSearching(false);
        }
      });
    }, 450);
    return () => clearTimeout(t);
  }, [ql]);

  const openDetail = (c: FoodCandidate, isCustom = false) => {
    setCand(c);
    setAmount(c.defaultAmount || 100);
    setCustom(isCustom);
    setNotFound(null);
    setOffline(null);
    setStep('detail');
  };

  const onScan = async (code: string) => {
    setStep('browse');
    const clean = code.replace(/\D/g, '');

    // 1) instant hit from foods you've logged before (works offline)
    const r = recents.find((x) => x.barcode && x.barcode.replace(/\D/g, '') === clean);
    if (r) { openDetail(recentToCandidate(r)); return; }

    // 2) cache + Open Food Facts
    setLooking(true);
    setNotFound(null);
    setOffline(null);
    const res = await lookupBarcode(clean);
    setLooking(false);

    if (res.status === 'found') {
      openDetail(res.food);
    } else if (res.status === 'offline') {
      openDetail(blankDraft(clean), true);
      setOffline(clean);
    } else {
      openDetail(blankDraft(clean), true);
      setNotFound(clean);
    }
  };

  const commit = () => {
    if (!cand) return;
    const name = cand.name.trim() || 'Onbekend';
    const item: FoodItem = {
      id: newId(),
      name,
      brand: cand.brand,
      amount: Math.max(1, Math.round(amount)),
      unit: cand.unit,
      per100: cand.per100,
      micros: cand.micros,
      barcode: cand.barcode,
    };
    onAdd(item);
    onClose();
  };

  // --- scan step ---
  if (step === 'scan') {
    return (
      <Suspense fallback={<div className="ff-scan"><div className="ff-scan-view"><div className="ff-scan-hint">Camera laden…</div></div></div>}>
        <BarcodeScanner onDetected={onScan} onClose={() => setStep('browse')} />
      </Suspense>
    );
  }

  // --- detail / amount step ---
  if (step === 'detail' && cand) {
    const m = scale(cand.per100, amount);
    const setPer = (k: keyof FoodCandidate['per100'], v: number) =>
      setCand((c) => (c ? { ...c, per100: { ...c.per100, [k]: v } } : c));

    return (
      <div className="ff-overlay">
        <div className="ff-ohead">
          <button className="ff-x" onClick={() => setStep('browse')}>{Ic.chev(18, 'currentColor')}</button>
          <div className="ff-sublabel">Hoeveelheid · {MEAL_LABEL[meal]}</div>
          <div className="ff-x" style={{ borderColor: 'transparent', background: 'transparent' }} />
        </div>
        <div className="ff-obody">
          {custom ? (
            <>
              {offline && (
                <div className="ff-note">Geen verbinding — kon barcode {offline} niet opzoeken. Vul de macro's nu handmatig in, of probeer later opnieuw online.</div>
              )}
              {notFound && (
                <div className="ff-note">Barcode {notFound} niet gevonden in de database — vul de gegevens zelf in.</div>
              )}
              <input
                className="ff-search"
                placeholder="Naam van de voeding"
                value={cand.name}
                onChange={(e) => setCand((c) => (c ? { ...c, name: e.target.value } : c))}
                autoFocus
              />
              <div className="ff-sublabel" style={{ margin: '16px 0 8px' }}>Per 100 {cand.unit}</div>
              <div className="ff-macroform">
                <MacroInput label="kcal" value={cand.per100.kcal} onCommit={(v) => setPer('kcal', v)} />
                <MacroInput label="koolh." value={cand.per100.carbs} onCommit={(v) => setPer('carbs', v)} />
                <MacroInput label="eiwit" value={cand.per100.protein} onCommit={(v) => setPer('protein', v)} />
                <MacroInput label="vet" value={cand.per100.fat} onCommit={(v) => setPer('fat', v)} />
              </div>
            </>
          ) : (
            <div className="ff-food-head">
              <div className="ff-food-name">{cand.name}</div>
              {cand.brand && <div className="ff-food-brand">{cand.brand}</div>}
              <div className="ff-food-per100">
                Per 100 {cand.unit}: {Math.round(cand.per100.kcal)} kcal · K {cand.per100.carbs} · E {cand.per100.protein} · V {cand.per100.fat}
              </div>
              {cand.micros && (
                <div className="ff-food-per100" style={{ marginTop: 4 }}>
                  {[
                    cand.micros.fiber != null ? `vezels ${cand.micros.fiber}` : null,
                    cand.micros.sugar != null ? `suiker ${cand.micros.sugar}` : null,
                    cand.micros.satfat != null ? `verz. vet ${cand.micros.satfat}` : null,
                    cand.micros.salt != null ? `zout ${cand.micros.salt}` : null,
                  ].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          )}

          <div className="ff-sublabel" style={{ margin: '18px 0 8px' }}>Hoeveelheid ({cand.unit})</div>
          <div className="ff-stepper">
            <button className="ff-step-btn" onClick={() => setAmount((a) => Math.max(1, Math.round(a - 10)))}>−</button>
            <EditNum value={amount} unit={cand.unit} round onCommit={(v) => setAmount(Math.max(1, v))} />
            <button className="ff-step-btn" onClick={() => setAmount((a) => Math.round(a + 10))}>+</button>
          </div>

          <div className="ff-macro-preview">
            <div className="mp kcal"><b>{m.kcal}</b><span>kcal</span></div>
            <div className="mp"><i style={{ background: 'var(--ff-carb)' }} /><b>{m.carbs}g</b><span>koolh.</span></div>
            <div className="mp"><i style={{ background: 'var(--ff-protein)' }} /><b>{m.protein}g</b><span>eiwit</span></div>
            <div className="mp"><i style={{ background: 'var(--ff-fat)' }} /><b>{m.fat}g</b><span>vet</span></div>
          </div>

          <div style={{ flex: 1, minHeight: 16 }} />
          <button className="ff-btn ff-btn-primary" disabled={custom && !cand.name.trim()} onClick={commit}>
            Toevoegen aan {MEAL_LABEL[meal]}
          </button>
        </div>
      </div>
    );
  }

  // --- browse step ---
  return (
    <div className="ff-overlay">
      <div className="ff-ohead">
        <button className="ff-x" onClick={onClose}>{Ic.close(18)}</button>
        <div className="ff-sublabel">Voeding toevoegen · {MEAL_LABEL[meal]}</div>
        <div className="ff-x" style={{ borderColor: 'transparent', background: 'transparent' }} />
      </div>
      <div className="ff-obody">
        <button className="ff-scan-btn" onClick={() => setStep('scan')}>
          {Ic.barcode(20)} Scan barcode
        </button>

        {looking && <div className="ff-note" style={{ marginTop: 12 }}>Product opzoeken…</div>}

        <div className="ff-search-wrap" style={{ marginTop: 14 }}>
          {Ic.search(17)}
          <input
            className="ff-search"
            placeholder="Zoek voeding…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="ff-scroll" style={{ margin: '14px -18px 0' }}>
          <div style={{ padding: '0 18px' }}>
            {recentCands.length > 0 && (
              <>
                <div className="ff-sublabel" style={{ marginBottom: 8 }}>Recent</div>
                {recentCands.map((f, i) => (
                  <FoodRow key={'r' + i} c={f} onClick={() => openDetail(f)} />
                ))}
              </>
            )}

            {localMatches.length > 0 && (
              <>
                <div className="ff-sublabel" style={{ margin: recentCands.length > 0 ? '18px 0 8px' : '0 0 8px' }}>{ql ? 'Veelgebruikt' : 'Veelgebruikt — tik om toe te voegen'}</div>
                {localMatches.map((f, i) => (
                  <FoodRow key={'l' + i} c={f} onClick={() => openDetail(f)} />
                ))}
              </>
            )}

            {ql.length >= 2 && (
              <>
                <div className="ff-sublabel" style={{ margin: '18px 0 8px' }}>
                  Open Food Facts {searching && <span style={{ color: 'var(--ff-faint)' }}>· zoeken…</span>}
                </div>
                {online.map((f, i) => (
                  <FoodRow key={'o' + i} c={f} onClick={() => openDetail(f)} />
                ))}
                {!searching && online.length === 0 && (
                  <div style={{ color: 'var(--ff-faint)', fontSize: 13, fontFamily: 'var(--ff-mono)', padding: '4px 2px' }}>
                    Geen online resultaten
                  </div>
                )}
              </>
            )}

            <button
              className="ff-btn ff-btn-ghost"
              style={{ marginTop: 18 }}
              onClick={() => openDetail(blankDraft(), true)}
            >
              + Eigen voeding invoeren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FoodRow({ c, onClick }: { c: FoodCandidate; onClick: () => void }) {
  return (
    <div className="ff-food-row" onClick={onClick}>
      <div style={{ minWidth: 0 }}>
        <div className="ff-food-row-name">{c.name}</div>
        <div className="ff-food-row-sub">
          {c.brand ? c.brand + ' · ' : ''}{Math.round(c.per100.kcal)} kcal/100{c.unit}
        </div>
      </div>
      <span className="ff-food-row-add">{Ic.chev(16)}</span>
    </div>
  );
}

function MacroInput({ label, value, onCommit }: { label: string; value: number; onCommit: (v: number) => void }) {
  return (
    <div className="ff-macrofield">
      <EditNum value={value} unit={label} onCommit={onCommit} />
    </div>
  );
}
