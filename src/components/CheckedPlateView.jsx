import data from '../data/checkedPlate.json';

const KG_TO_LB = 1 / 0.453592;
const KGM2_TO_PSF = 1 / 4.88243;

/** ASTM A786 floor/diamond plate table: thicknessIn/psf are the standard's
 * native values (US), thicknessMm/kgm2 are given alongside directly in the
 * source reference, and panel4x8Lb = psf × 32ft² is also given directly. */
function AstmTable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th>Gauge / Thickness</th>
          <th className="r">Thickness (in)</th><th className="r">Thickness (mm)</th>
          <th className="r">Unit Weight (psf)</th><th className="r">Unit Weight (kg/m²)</th>
          <th className="r">4' × 8' Panel Weight (lb)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.gaugeLabel}>
            <td className="mono strong">{r.gaugeLabel}</td>
            <td className="r mono">{r.thicknessIn.toFixed(3)}</td><td className="r mono">{r.thicknessMm}</td>
            <td className="r mono">{r.psf.toFixed(2)}</td><td className="r mono">{r.kgm2.toFixed(2)}</td>
            <td className="r mono">{r.panel4x8Lb.toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** KS D 3568 checked-plate table: thicknessMm/kgm2/panel weights (kg) are
 * the source's native values; psf and lb panel weights are this app's
 * conversion. */
function KsTable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th className="r">Thickness (mm)</th>
          <th className="r">Unit Weight (kg/m²)</th><th className="r">Unit Weight (psf)</th>
          <th className="r">3' × 6' (914×1829mm) Panel (kg)</th><th className="r">3' × 6' Panel (lb)</th>
          <th className="r">4' × 8' (1219×2438mm) Panel (kg)</th><th className="r">4' × 8' Panel (lb)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.thicknessMm}>
            <td className="r mono strong">{r.thicknessMm}t</td>
            <td className="r mono">{r.kgm2.toFixed(2)}</td><td className="r mono val-conv">{(r.kgm2 * KGM2_TO_PSF).toFixed(2)}</td>
            <td className="r mono">{r.panel3x6Kg.toFixed(1)}</td><td className="r mono val-conv">{(r.panel3x6Kg * KG_TO_LB).toFixed(1)}</td>
            <td className="r mono">{r.panel4x8Kg.toFixed(1)}</td><td className="r mono val-conv">{(r.panel4x8Kg * KG_TO_LB).toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Checked/diamond-plate unit-weight reference, per standard: `standard`
 * is 'astm' (ASTM A786, imperial-native) or 'ks' (KS D 3568, SI-native) —
 * same AISC/KS split pattern as the H-Shape sidebar entries. */
export default function CheckedPlateView({ standard }) {
  const isKs = standard === 'ks';
  const d = isKs ? data.ks : data.astm;

  return (
    <>
      <div className="detail-head">
        <div><h1 className="mono">Checked Plate — {isKs ? 'KS D 3568' : 'ASTM A786'}</h1></div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>{isKs ? '무늬강판 (Checked Plate)' : '무늬강판 (Floor Plate / Diamond Plate)'}</h2>
          <span className="tag">{d.rows.length} sizes</span>
        </div>
        {isKs ? <KsTable rows={d.rows} /> : <AstmTable rows={d.rows} />}
        <p className="note">{d.source}</p>
        <p className="note">{d.note}</p>
      </div>
    </>
  );
}
