import thicknesses from '../../data/plateThickness.json';
import { gradeLabel } from './steelGrade.js';

const IN_TO_MM = 25.4, MM_TO_IN = 1 / 25.4;
const EPS = 0.01;

/** Compact dimension-entry table, transposed: one row per field (height/
 * width/thickness…), columns = IN value | MM value — editing either unit
 * live-updates the other. Thickness fields (`thickness: true`) get a
 * standard-size dropdown and an ASTM grade-availability hint next to the
 * inch value. `mm` is the field->mm value map; `onChangeMm(key)` returns a
 * setter for that field. */
export default function BHDimTable({ fields, mm, onChangeMm }) {
  return (
    <table className="bh-dim-table">
      <thead>
        <tr><th /><th>IN</th><th>MM</th></tr>
      </thead>
      <tbody>
        {fields.map((f) => {
          const v = mm[f.key];
          const inVal = v != null ? v * MM_TO_IN : '';

          const onInType = (e) => {
            const x = parseFloat(e.target.value);
            if (Number.isFinite(x) && x > 0) onChangeMm(f.key)(x * IN_TO_MM);
          };
          const onMmType = (e) => {
            const x = parseFloat(e.target.value);
            if (Number.isFinite(x) && x > 0) onChangeMm(f.key)(x);
          };
          const selId = f.thickness && v != null
            ? (thicknesses.find((t) => Math.abs(t.thickness_mm - v) < EPS)?.id ?? '')
            : '';
          const onSelect = (e) => {
            const t = thicknesses.find((x) => String(x.id) === e.target.value);
            if (t) onChangeMm(f.key)(t.thickness_mm);
          };

          return (
            <tr key={f.key}>
              <th>{f.label}</th>
              <td>
                {f.thickness && (
                  <select value={selId} onChange={onSelect}>
                    <option value="">직접입력…</option>
                    {thicknesses.map((t) => <option key={t.id} value={t.id}>{t.thickness_in}"</option>)}
                  </select>
                )}
                <input
                  type="number" step={f.thickness ? 0.001 : 0.01}
                  value={inVal === '' ? '' : +inVal.toFixed(4)} onChange={onInType}
                />
                {f.thickness && inVal !== '' && <span className="grade-badge">{gradeLabel(inVal)}</span>}
              </td>
              <td>
                <input type="number" step={f.thickness ? 0.1 : 1} value={v == null ? '' : +v.toFixed(3)} onChange={onMmType} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
