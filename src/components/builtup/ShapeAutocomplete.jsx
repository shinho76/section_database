import { useEffect, useRef, useState } from 'react';
import { loadType } from '../../lib/dataLoader.js';

/** Search-as-you-type shape picker, scoped to one type (like the header
 * search box, but narrowed to a single AISC/KS type). Typing filters a
 * dropdown of matching shapes; clicking one calls onSelect with the full
 * shape record. */
export default function ShapeAutocomplete({ type, onSelect, placeholder }) {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadType(type).then((r) => { if (!cancelled) setRows(r); });
    setQuery('');
    return () => { cancelled = true; };
  }, [type]);

  useEffect(() => {
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const q = query.trim().toUpperCase();
  const filtered = !open ? [] : rows.filter((s) => s.name.toUpperCase().includes(q)).slice(0, 40);

  const pick = (s) => {
    setQuery(s.name);
    setOpen(false);
    onSelect(s);
  };

  return (
    <div className="combo" ref={boxRef}>
      <input
        type="text" placeholder={placeholder || '검색…'} autoComplete="off"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
      />
      {open && filtered.length > 0 && (
        <ul className="combo-list">
          {filtered.map((s, i) => (
            <li key={`${s.name}-${s.ks}-${i}`} onMouseDown={() => pick(s)}>
              <span className="mono">{s.name}</span>
              <span className="combo-mm">{s.ks}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
