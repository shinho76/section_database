import thicknesses from '../../data/plateThickness.json';
import { gradeLabel } from './steelGrade.js';

const IN_TO_MM = 25.4, MM_TO_IN = 1 / 25.4;
const EPS = 0.01;

/** One field's IN-side cell content: thickness dropdown (if flagged) + the
 * inch input + grade badge. Shared by both the merged table and the split
 * IN/MM card layout below. */
function InCell({ f, mm, onChangeMm }) {
  const v = mm[f.key];
  const inVal = v != null ? v * MM_TO_IN : '';
  const onType = (e) => {
    const raw = e.target.value;
    if (raw === '') { onChangeMm(f.key)(null); return; }
    const x = parseFloat(raw);
    if (Number.isFinite(x) && x > 0) onChangeMm(f.key)(x * IN_TO_MM);
  };
  const selId = f.thickness && v != null
    ? (thicknesses.find((t) => Math.abs(t.thickness_mm - v) < EPS)?.id ?? '')
    : '';
  const onSelect = (e) => {
    const t = thicknesses.find((x) => String(x.id) === e.target.value);
    if (t) onChangeMm(f.key)(t.thickness_mm);
  };
  return (
    <>
      {f.thickness && (
        <select value={selId} onChange={onSelect}>
          <option value="">직접입력…</option>
          {thicknesses.map((t) => <option key={t.id} value={t.id}>{t.thickness_in}"</option>)}
        </select>
      )}
      <input
        type="number" step={f.thickness ? 0.001 : 0.01}
        value={inVal === '' ? '' : +inVal.toFixed(4)} onChange={onType}
      />
      {f.thickness && inVal !== '' && <span className="grade-badge">{gradeLabel(inVal)}</span>}
    </>
  );
}

/** One field's MM-side cell content: plain mm input. */
function MmCell({ f, mm, onChangeMm }) {
  const v = mm[f.key];
  const onType = (e) => {
    const raw = e.target.value;
    if (raw === '') { onChangeMm(f.key)(null); return; }
    const x = parseFloat(raw);
    if (Number.isFinite(x) && x > 0) onChangeMm(f.key)(x);
  };
  return <input type="number" step={f.thickness ? 0.1 : 1} value={v == null ? '' : +v.toFixed(3)} onChange={onType} />;
}

/** Dimension-entry table: row 1 = field names (height/width/thickness…),
 * row 2 = inch values, row 3 = mm values — editing either unit row updates
 * the other live. Thickness fields (`thickness: true`) get a standard-size
 * dropdown and an ASTM grade-availability hint next to the inch value.
 * `mm` is the field->mm value map; `onChangeMm(key)` returns a setter. */
export default function BHDimTable({ fields, mm, onChangeMm }) {
  return (
    <table className="bh-dim-table">
      <thead>
        <tr>
          <th />
          {fields.map((f) => <th key={f.key}>{f.label}</th>)}
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>IN</th>
          {fields.map((f) => <td key={f.key}><InCell f={f} mm={mm} onChangeMm={onChangeMm} /></td>)}
        </tr>
        <tr>
          <th>MM</th>
          {fields.map((f) => <td key={f.key}><MmCell f={f} mm={mm} onChangeMm={onChangeMm} /></td>)}
        </tr>
      </tbody>
    </table>
  );
}

/** Same field set as BHDimTable, but laid out as two side-by-side cards —
 * "치수입력(IN)" and "치수입력(MM)" — each holding its own single-unit table,
 * matching the SVG(IN)/SVG(MM) card pair below it. Used where a full-width
 * dimension panel has room for two cards (BH-1, BH-2, Plate). */
export function BHDimCards({ fields, mm, onChangeMm }) {
  return (
    <div className="draw-grid">
      <div className="panel dimcard">
        <div className="panel-head"><h2>치수입력<span className="unit-tag">IN</span></h2></div>
        <div style={{ padding: 14, overflowX: 'auto' }}>
          <table className="bh-dim-table bh-dim-table-split">
            <thead><tr>{fields.map((f) => <th key={f.key}>{f.label}</th>)}</tr></thead>
            <tbody>
              <tr>{fields.map((f) => <td key={f.key}><InCell f={f} mm={mm} onChangeMm={onChangeMm} /></td>)}</tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="panel dimcard">
        <div className="panel-head"><h2>치수입력<span className="unit-tag">MM</span></h2></div>
        <div style={{ padding: 14, overflowX: 'auto' }}>
          <table className="bh-dim-table bh-dim-table-split">
            <thead><tr>{fields.map((f) => <th key={f.key}>{f.label}</th>)}</tr></thead>
            <tbody>
              <tr>{fields.map((f) => <td key={f.key}><MmCell f={f} mm={mm} onChangeMm={onChangeMm} /></td>)}</tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
