import thicknesses from '../../data/plateThickness.json';
import { gradeLabel } from './steelGrade.js';

const IN_TO_MM = 25.4, MM_TO_IN = 1 / 25.4;
const EPS = 0.01;

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
          {fields.map((f) => {
            const v = mm[f.key];
            const inVal = v != null ? v * MM_TO_IN : '';
            const onType = (e) => {
              const x = parseFloat(e.target.value);
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
              <td key={f.key}>
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
              </td>
            );
          })}
        </tr>
        <tr>
          <th>MM</th>
          {fields.map((f) => {
            const v = mm[f.key];
            const onType = (e) => {
              const x = parseFloat(e.target.value);
              if (Number.isFinite(x) && x > 0) onChangeMm(f.key)(x);
            };
            return (
              <td key={f.key}>
                <input type="number" step={f.thickness ? 0.1 : 1} value={v == null ? '' : +v.toFixed(3)} onChange={onType} />
              </td>
            );
          })}
        </tr>
      </tbody>
    </table>
  );
}
