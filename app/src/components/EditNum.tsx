import { useEffect, useState } from 'react';

// tappable, typeable number field (works alongside the +/- steppers)
export function EditNum({
  value,
  unit,
  round,
  onCommit,
}: {
  value: number;
  unit: string;
  round?: boolean;
  onCommit: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [txt, setTxt] = useState(String(value));

  useEffect(() => {
    if (!editing) setTxt(String(value));
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    let v = parseFloat(String(txt).replace(',', '.'));
    if (!isNaN(v)) {
      v = Math.max(0, v);
      onCommit(round ? Math.round(v) : v);
    }
  };

  return (
    <div className="ff-step-val">
      <input
        className="ff-numinput"
        inputMode="decimal"
        value={txt}
        onFocus={(e) => {
          setEditing(true);
          setTimeout(() => e.target.select(), 0);
        }}
        onChange={(e) => setTxt(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
      <div className="u">{unit}</div>
    </div>
  );
}
