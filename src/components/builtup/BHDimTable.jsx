import thicknesses from '../../data/plateThickness.json';
import { gradeLabel, gradeTitle, ksGradeLabel, ksGradeTitle } from './steelGrade.js';

const IN_TO_MM = 25.4, MM_TO_IN = 1 / 25.4;
const EPS = 0.01;
const LABEL_RE = /^(.*?)\s*(\([^)]*\))$/;
// Both unit lists share one <select> (grouped by optgroup) and one id
// space (imperial: 1-24, ks: 101+, see plateThickness.json) so a single
// lookup can resolve either kind of selection.
const ALL_THICKNESSES = [...thicknesses.imperial, ...thicknesses.ks];

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
  const matchedKs = f.thickness && v != null
    ? thicknesses.ks.find((t) => Math.abs(t.thickness_mm - v) < EPS)
    : null;
  const selId = f.thickness && v != null
    ? (ALL_THICKNESSES.find((t) => Math.abs(t.thickness_mm - v) < EPS)?.id ?? '')
    : '';
  const onSelect = (e) => {
    const t = ALL_THICKNESSES.find((x) => String(x.id) === e.target.value);
    if (t) onChangeMm(f.key)(t.thickness_mm);
  };
  return (
    <>
      {f.thickness ? (
        <select value={selId} onChange={onSelect}>
          <option value="">직접입력…</option>
          <optgroup label="Imperial (in)">
            {thicknesses.imperial.map((t) => <option key={t.id} value={t.id}>{t.thickness_in}"</option>)}
          </optgroup>
          <optgroup label="KS (mm)">
            {thicknesses.ks.map((t) => <option key={t.id} value={t.id}>{t.thickness_mm}mm</option>)}
          </optgroup>
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
      {f.thickness && inVal !== '' && (
        matchedKs
          ? <span className="grade-badge" title={ksGradeTitle(matchedKs)}>{ksGradeLabel(matchedKs)}</span>
          : <span className="grade-badge" title={gradeTitle(inVal)}>{gradeLabel(inVal)}</span>
      )}
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
  const selId = v != null ? (ALL_THICKNESSES.find((t) => Math.abs(t.thickness_mm - v) < EPS)?.id ?? '') : '';
  const onSelect = (e) => {
    const t = ALL_THICKNESSES.find((x) => String(x.id) === e.target.value);
    if (t) onChangeMm(f.key)(t.thickness_mm);
  };
  return (
    <div className="dim-row-in-thickness">
      <select value={selId} onChange={onSelect}>
        <option value="">직접입력…</option>
        <optgroup label="Imperial (in)">
          {thicknesses.imperial.map((t) => <option key={t.id} value={t.id}>{t.thickness_in}"</option>)}
        </optgroup>
        <optgroup label="KS (mm)">
          {thicknesses.ks.map((t) => <option key={t.id} value={t.id}>{t.thickness_mm}mm</option>)}
        </optgroup>
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

/** Column spec for BHDimCardsGrouped: either a plain single-value column
 * ({ type:'single', key, label, thickness? }) or a top/bottom pair sharing
 * one column ({ type:'group', label, top:{key,thickness?}, bottom:{...} }). */

/** Same two IN/MM cards as BHDimCards, but columns follow the conventional
 * D / B / Tw / Tf reading order instead of a flat D/Bf-top/Tf-top/Bf-bot/
 * Tf-bot/Tw list — for unequal-flange sections, the top and bottom flange's
 * B (and Tf) values share one column, stacked as a "상부" row over a "하부"
 * row, so the two numbers that matter to compare sit right on top of each
 * other instead of being split apart by Tw. Single-value columns (D, Tw)
 * span both rows via rowSpan so they stay vertically centered. */
export function BHDimCardsGrouped({ columns, mm, onChangeMm }) {
  const groupCols = columns.filter((c) => c.type === 'group');
  const Cell = (unit) => (unit === 'IN' ? InCell : MmCell);

  const renderCards = (unit) => {
    const ValueCell = Cell(unit);
    return (
      <div className="panel dimcard" key={unit}>
        <div className="panel-head"><h2>치수입력<span className="unit-tag">{unit}</span></h2></div>
        <div style={{ padding: 14, overflowX: 'auto' }}>
          <table className="bh-dim-table bh-dim-table-split bh-dim-grouped">
            <thead>
              <tr>{columns.map((c) => <HeaderCell key={c.label} f={c} />)}</tr>
            </thead>
            <tbody>
              <tr>
                {columns.map((c) => (
                  c.type === 'single'
                    ? <td key={c.key} rowSpan={2}><ValueCell f={c} mm={mm} onChangeMm={onChangeMm} /></td>
                    : (
                      <td key={`${c.label}-top`}>
                        <span className="dim-subrow-label">상부</span>
                        <ValueCell f={c.top} mm={mm} onChangeMm={onChangeMm} />
                      </td>
                    )
                ))}
              </tr>
              <tr>
                {groupCols.map((c) => (
                  <td key={`${c.label}-bot`}>
                    <span className="dim-subrow-label">하부</span>
                    <ValueCell f={c.bottom} mm={mm} onChangeMm={onChangeMm} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="draw-grid">
      {renderCards('IN')}
      {renderCards('MM')}
    </div>
  );
}
