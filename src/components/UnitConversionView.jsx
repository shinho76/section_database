import { useState } from 'react';
import unitGroups from '../data/unitGroups.json';

// Ported from https://shinho76.github.io/web_calculation_03/ (same author's
// standalone unit-conversion tool) so it lives inside this app instead of
// being an external link. Each category keeps one canonical value in its
// base unit (unitGroups.json's `baseUnit`); every visible field is derived
// from that base via `factor` (value_in_unit = base * factor), except the
// "ft-in" field which is `virtual` (feet + inches split of the LENGTH base)
// and the `inputable:false` fields (ft/in decimal read-outs) which display
// only — editing happens through the other fields in the same category.
const REFERENCE_ROWS = [
  { category: 'Forces', from: 'kip', to: 'kN', factor: 4.448 },
  { category: '', from: 'lb', to: 'N', factor: 4.448 },
  { category: '', from: 'kN', to: 'kip', factor: 0.2248 },
  { category: 'Stresses', from: 'ksi', to: 'MPa', factor: 6.895 },
  { category: '', from: 'psi', to: 'MPa', factor: 0.006895 },
  { category: '', from: 'MPa', to: 'ksi', factor: 0.145 },
  { category: '', from: 'MPa', to: 'psi', factor: 145 },
  { category: 'Moments', from: 'ft-kip', to: 'kN-m', factor: 1.356 },
  { category: '', from: 'kN-m', to: 'ft-kip', factor: 0.7376 },
  { category: 'Uniform Loading', from: 'kip/ft', to: 'kN/m', factor: 14.59 },
  { category: '', from: 'kN/m', to: 'kip/ft', factor: 0.06852 },
  { category: '', from: 'kip/ft²', to: 'kN/m²', factor: 47.88 },
  { category: '', from: 'psf', to: 'N/m²', factor: 47.88 },
  { category: '', from: 'kN/m²', to: 'kip/ft²', factor: 0.02089 },
];

const FT_FACTOR = unitGroups[0].units.ft.factor;

function fmt(n, precision) {
  if (!Number.isFinite(n)) return '';
  return +n.toFixed(precision);
}

/** One category card: a single `base` value drives every field. */
function CategoryCard({ group }) {
  const [base, setBase] = useState(1);
  const entries = Object.entries(group.units);

  const setFromUnit = (factor) => (raw) => {
    if (raw === '') return;
    const x = parseFloat(raw);
    if (Number.isFinite(x)) setBase(x / factor);
  };

  // ft-in virtual field: base(m) -> total feet -> whole feet + decimal inches.
  const totalFt = base * FT_FACTOR;
  const wholeFt = Math.floor(totalFt);
  const inches = (totalFt - wholeFt) * 12;
  const setFromFtIn = (feetRaw, inRaw) => {
    const f = parseFloat(feetRaw);
    const i = parseFloat(inRaw);
    const ftPart = Number.isFinite(f) ? f : 0;
    const inPart = Number.isFinite(i) ? i : 0;
    if (feetRaw === '' && inRaw === '') return;
    setBase((ftPart + inPart / 12) / FT_FACTOR);
  };

  return (
    <div className="panel unitconv-card">
      <div className="panel-head"><h2>{group.category}</h2></div>
      <div className="unitconv-fields">
        {entries.map(([key, u]) => {
          if (u.virtual) {
            return (
              <div className="unitconv-field" key={key}>
                <label>{u.label}</label>
                <div className="unitconv-ftin">
                  <input
                    type="text" inputMode="decimal" placeholder="ft"
                    value={fmt(wholeFt, 0)}
                    onChange={(e) => setFromFtIn(e.target.value, String(fmt(inches, u.precision)))}
                  />
                  <input
                    type="text" inputMode="decimal" placeholder="in"
                    value={fmt(inches, u.precision)}
                    onChange={(e) => setFromFtIn(String(fmt(wholeFt, 0)), e.target.value)}
                  />
                </div>
                <div className="unitconv-ftin-sub"><span>ft</span><span>in</span></div>
              </div>
            );
          }
          const val = fmt(base * u.factor, u.precision);
          return (
            <div className="unitconv-field" key={key}>
              <label>{u.label}</label>
              <input
                type="text" inputMode="decimal"
                className={u.inputable ? undefined : 'unitconv-readonly'}
                readOnly={!u.inputable}
                value={val}
                onChange={u.inputable ? (e) => setFromUnit(u.factor)(e.target.value) : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function UnitConversionView() {
  return (
    <>
      <div className="detail-head"><div><h1 className="mono">UNIT CONVERSION</h1></div></div>
      <div className="unitconv-grid">
        {unitGroups.map((g) => <CategoryCard group={g} key={g.category} />)}
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Reference: Structural Unit Conversion Factors</h2></div>
        <table className="list">
          <thead>
            <tr><th>Category</th><th>From</th><th>To</th><th className="r">Multiply by</th></tr>
          </thead>
          <tbody>
            {REFERENCE_ROWS.map((r, i) => (
              <tr key={i}>
                <td className="mono strong">{r.category}</td>
                <td className="mono">{r.from}</td>
                <td className="mono">{r.to}</td>
                <td className="r mono">{r.factor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
