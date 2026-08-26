import { useState } from 'react';

const IN_TO_MM = 25.4, FT_TO_MM = 304.8;

/** Imperial length field with an in/ft unit toggle, paired with a live-synced
 * mm field on the right (SI side auto-converts from whichever side changed). */
export default function LengthInput({ label, mm, onChangeMm }) {
  const [unit, setUnit] = useState('in');
  const factor = unit === 'in' ? IN_TO_MM : FT_TO_MM;
  const impVal = mm != null ? mm / factor : '';

  const setFromImp = (e) => {
    const v = parseFloat(e.target.value);
    onChangeMm(Number.isFinite(v) && v > 0 ? v * factor : null);
  };
  const setFromMm = (e) => {
    const v = parseFloat(e.target.value);
    onChangeMm(Number.isFinite(v) && v > 0 ? v : null);
  };

  return (
    <div className="dual-unit">
      <span className="dual-unit-label">{label}</span>
      <div className="dual-unit-pair">
        <label className="dual-unit-side">
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="in">in</option>
            <option value="ft">ft</option>
          </select>
          <input type="number" step="0.01" value={impVal === '' ? '' : +impVal.toFixed(4)} onChange={setFromImp} />
        </label>
        <label className="dual-unit-side">
          <span>mm</span>
          <input type="number" step="1" value={mm == null ? '' : +mm.toFixed(1)} onChange={setFromMm} />
        </label>
      </div>
    </div>
  );
}
