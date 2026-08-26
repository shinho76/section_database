import thicknesses from '../../data/plateThickness.json';

const IN_TO_MM = 25.4, MM_TO_IN = 1 / 25.4;
const EPS = 0.01;

// Common market-stock plate thicknesses (mm) — KS structural plate series.
const COMMON_MM = [3, 4, 4.5, 5, 6, 8, 9, 10, 12, 14, 16, 19, 20, 22, 25, 28, 30, 32, 36, 40, 45, 50];

/** Two side-by-side cards (Imperial / Metric) for one thickness value.
 * Each card has both a dropdown (standard sizes) and a free-entry number
 * field; editing either card converts and updates the other immediately. */
export default function PlateThicknessInput({ label, mm, onChangeMm }) {
  const inVal = mm != null ? mm * MM_TO_IN : '';
  const selectedInId = mm != null
    ? (thicknesses.find((t) => Math.abs(t.thickness_mm - mm) < EPS)?.id ?? '')
    : '';
  const selectedMm = mm != null
    ? (COMMON_MM.find((v) => Math.abs(v - mm) < EPS) ?? '')
    : '';

  const onInSelect = (e) => {
    const t = thicknesses.find((x) => String(x.id) === e.target.value);
    if (t) onChangeMm(t.thickness_mm);
  };
  const onInType = (e) => {
    const v = parseFloat(e.target.value);
    if (Number.isFinite(v) && v > 0) onChangeMm(v * IN_TO_MM);
  };
  const onMmSelect = (e) => {
    const v = parseFloat(e.target.value);
    if (Number.isFinite(v)) onChangeMm(v);
  };
  const onMmType = (e) => {
    const v = parseFloat(e.target.value);
    if (Number.isFinite(v) && v > 0) onChangeMm(v);
  };

  return (
    <div className="plate-th">
      <span className="plate-th-label">{label}</span>
      <div className="plate-th-cards">
        <div className="plate-th-card">
          <div className="plate-th-card-head">Imperial <span>in</span></div>
          <select value={selectedInId} onChange={onInSelect}>
            <option value="">직접입력…</option>
            {thicknesses.map((t) => <option key={t.id} value={t.id}>{t.thickness_in}"</option>)}
          </select>
          <input type="number" step="0.001" value={inVal === '' ? '' : +inVal.toFixed(4)} onChange={onInType} />
        </div>
        <div className="plate-th-card">
          <div className="plate-th-card-head">Metric <span>mm</span></div>
          <select value={selectedMm} onChange={onMmSelect}>
            <option value="">직접입력…</option>
            {COMMON_MM.map((v) => <option key={v} value={v}>{v} mm</option>)}
          </select>
          <input type="number" step="0.1" value={mm == null ? '' : +mm.toFixed(3)} onChange={onMmType} />
        </div>
      </div>
    </div>
  );
}
