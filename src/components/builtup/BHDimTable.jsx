import thicknesses from '../../data/plateThickness.json';
import { gradeLabel } from './steelGrade.js';

const IN_TO_MM = 25.4, MM_TO_IN = 1 / 25.4;
const EPS = 0.01;
const LABEL_RE = /^(.*?)\s*(\([^)]*\))$/;

/** Header cell: splits "Bf-top (폭)" into a main line and a parenthesized
 * unit line rendered on a second line, always — even for short labels like
 * "D (높이)" — so every header cell wraps to the same two-line height instead
 * of some columns wrapping (longer labels like bf-top) and others not. */
function HeaderCell({ f }) {
  const m = f.label.match(LABEL_RE);
  if (!m) return <th>{f.label}</th>;
  return (
    <th>
      <span className="dim-th-main">{m[1]}</span>
      <span className="dim-th-unit">{m[2]}</span>
    </th>
  );
}

/** Row-header cell for the field-per-row layout: same main/unit split as
 * HeaderCell, but rendered inline (label · unit) since it's a row label
 * sitting to the left of the value cells, not a two-line column head. */
function RowLabelCell({ f }) {
  const m = f.label.match(LABEL_RE);
  if (!m) return <th scope="row">{f.label}</th>;
  return (
    <th scope="row">
      <span className="dim-th-main">{m[1]}</span>{' '}
      <span className="dim-th-unit">{m[2]}</span>
    </th>
  );
}

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
      {f.thickness ? (
        <select value={selId} onChange={onSelect}>
          <option value="">직접입력…</option>
          {thicknesses.map((t) => <option key={t.id} value={t.id}>{t.thickness_in}"</option>)}
        </select>
      ) : (
        // Invisible placeholder so this input starts at the same y as a
        // thickness field's input, which sits below a real select.
        <select className="dim-select-spacer" disabled tabIndex={-1} aria-hidden="true"><option /></select>
      )}
      <span className="unit-input">
        <input
          type="number" step={f.thickness ? 0.001 : 0.01}
          value={inVal === '' ? '' : +inVal.toFixed(1)} onChange={onType}
        />
        <span className="unit-suffix">in</span>
      </span>
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
  return (
    <span className="unit-input">
      <input type="number" step={f.thickness ? 0.1 : 1} value={v == null ? '' : +v.toFixed(1)} onChange={onType} />
      <span className="unit-suffix">mm</span>
    </span>
  );
}

/** IN-side cell for the field-per-row layout only: thickness dropdown and
 * inch input sit inline on one line (no stacked select-above-input, no
 * grade badge) — every row is a single line, so it lines up with the plain
 * MM input beside it without needing spacer hacks. */
function InRowCell({ f, mm, onChangeMm }) {
  const v = mm[f.key];
  const inVal = v != null ? v * MM_TO_IN : '';
  const onType = (e) => {
    const raw = e.target.value;
    if (raw === '') { onChangeMm(f.key)(null); return; }
    const x = parseFloat(raw);
    if (Number.isFinite(x) && x > 0) onChangeMm(f.key)(x * IN_TO_MM);
  };
  if (!f.thickness) {
    return (
      <span className="unit-input">
        <input type="number" step={0.01} value={inVal === '' ? '' : +inVal.toFixed(1)} onChange={onType} />
        <span className="unit-suffix">in</span>
      </span>
    );
  }
  const selId = v != null ? (thicknesses.find((t) => Math.abs(t.thickness_mm - v) < EPS)?.id ?? '') : '';
  const onSelect = (e) => {
    const t = thicknesses.find((x) => String(x.id) === e.target.value);
    if (t) onChangeMm(f.key)(t.thickness_mm);
  };
  return (
    <div className="dim-row-in-thickness">
      <select value={selId} onChange={onSelect}>
        <option value="">직접입력…</option>
        {thicknesses.map((t) => <option key={t.id} value={t.id}>{t.thickness_in}"</option>)}
      </select>
      <span className="unit-input unit-input-compact">
        <input type="number" step={0.001} value={inVal === '' ? '' : +inVal.toFixed(1)} onChange={onType} />
        <span className="unit-suffix">in</span>
      </span>
    </div>
  );
}

/** Dimension-entry table, one row per field (D/Bf/Tw/Tf…) with the IN and MM
 * values side by side in that row — editing either updates the other live.
 * Narrower than a field-per-column layout (fixed value-column widths, no
 * stretch to 100%), meant to sit in a compact card rather than span the
 * full panel width. Thickness fields (`thickness: true`) get a standard-size
 * dropdown inline with the inch input (no grade badge — this layout keeps
 * every row to one line). `mm` is the field->mm value map; `onChangeMm(key)`
 * returns a setter. */
export default function BHDimTable({ fields, mm, onChangeMm }) {
  return (
    <table className="bh-dim-table bh-dim-rows">
      <thead>
        <tr>
          <th />
          <th>IN</th>
          <th>MM</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((f) => (
          <tr key={f.key}>
            <RowLabelCell f={f} />
            <td><InRowCell f={f} mm={mm} onChangeMm={onChangeMm} /></td>
            <td><MmCell f={f} mm={mm} onChangeMm={onChangeMm} /></td>
          </tr>
        ))}
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
            <thead><tr>{fields.map((f) => <HeaderCell key={f.key} f={f} />)}</tr></thead>
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
            <thead><tr>{fields.map((f) => <HeaderCell key={f.key} f={f} />)}</tr></thead>
            <tbody>
              <tr>{fields.map((f) => <td key={f.key}><MmCell f={f} mm={mm} onChangeMm={onChangeMm} /></td>)}</tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
