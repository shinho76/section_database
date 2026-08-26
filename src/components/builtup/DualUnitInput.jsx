const IN_TO_MM = 25.4;

/** Paired inch/mm number inputs for one dimension. Internally the value is
 * always tracked in mm (via onChangeMm); editing either side keeps both in
 * sync without rounding the stored value — only the display is rounded. */
export default function DualUnitInput({ label, mm, onChangeMm, step = 0.1 }) {
  const inch = mm != null ? mm / IN_TO_MM : '';

  const setFromIn = (e) => {
    const v = parseFloat(e.target.value);
    onChangeMm(Number.isFinite(v) ? v * IN_TO_MM : 0);
  };
  const setFromMm = (e) => {
    const v = parseFloat(e.target.value);
    onChangeMm(Number.isFinite(v) ? v : 0);
  };

  return (
    <div className="dual-unit">
      <span className="dual-unit-label">{label}</span>
      <div className="dual-unit-pair">
        <label className="dual-unit-side">
          <span>in</span>
          <input type="number" step={step} value={inch === '' ? '' : +inch.toFixed(4)} onChange={setFromIn} />
        </label>
        <label className="dual-unit-side">
          <span>mm</span>
          <input type="number" step={step} value={mm == null ? '' : +mm.toFixed(4)} onChange={setFromMm} />
        </label>
      </div>
    </div>
  );
}
