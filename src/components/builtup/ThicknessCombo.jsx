import { useEffect, useRef, useState } from 'react';
import thicknesses from '../../data/plateThickness.json';

/** Autocomplete combo box restricted to the standard plate-thickness list.
 * `value` is the thickness in mm (number or null); onChange receives mm. */
export default function ThicknessCombo({ value, onChange, placeholder = '두께 선택…' }) {
  const current = thicknesses.find((t) => t.thickness_mm === value);
  const [text, setText] = useState(current ? `${current.thickness_in}" (${current.thickness_mm.toFixed(2)}mm)` : '');
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const c = thicknesses.find((t) => t.thickness_mm === value);
    setText(c ? `${c.thickness_in}" (${c.thickness_mm.toFixed(2)}mm)` : '');
  }, [value]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const q = text.replace(/["()]/g, '').trim().toLowerCase();
  const filtered = !open ? [] : thicknesses.filter((t) =>
    !q || t.thickness_in.toLowerCase().includes(q) || String(t.thickness_mm).includes(q),
  );

  const pick = (t) => {
    setText(`${t.thickness_in}" (${t.thickness_mm.toFixed(2)}mm)`);
    setOpen(false);
    onChange(t.thickness_mm);
  };

  return (
    <div className="combo" ref={boxRef}>
      <input
        type="text"
        value={text}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setText(e.target.value); setOpen(true); }}
      />
      {open && filtered.length > 0 && (
        <ul className="combo-list">
          {filtered.map((t) => (
            <li key={t.id} onMouseDown={() => pick(t)}>
              <span className="mono">{t.thickness_in}"</span>
              <span className="combo-mm">{t.thickness_mm.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')} mm</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
