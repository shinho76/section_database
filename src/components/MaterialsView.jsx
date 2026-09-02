import data from '../data/materials.json';

const KSI_TO_MPA = 6.89476;

/** ASTM structural steel grades: ksi values are the AISC Manual native
 * table, MPa is this app's conversion. */
function AstmTable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th>Grade</th><th>Product</th>
          <th className="r">Fy (ksi)</th><th className="r">Fy (MPa)</th>
          <th className="r">Fu (ksi)</th><th className="r">Fu (MPa)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.grade}>
            <td className="mono strong">{r.grade}</td>
            <td className="desc">{r.product}</td>
            <td className="r mono">{r.fyKsi}</td>
            <td className="r mono val-conv">{r.fyMpa ?? Math.round(r.fyKsi * KSI_TO_MPA)}</td>
            <td className="r mono">{r.fuKsi}</td>
            <td className="r mono val-conv">{r.fuMpa ?? Math.round(r.fuKsi * KSI_TO_MPA)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** KS steel grades: MPa values are the KS standard's native table, ksi is
 * this app's conversion. */
function KsTable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th>Grade</th><th>Product</th>
          <th className="r">Fy (MPa)</th><th className="r">Fy (ksi)</th>
          <th className="r">Fu (MPa)</th><th className="r">Fu (ksi)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.grade}>
            <td className="mono strong">{r.grade}</td>
            <td className="desc">{r.product}</td>
            <td className="r mono">{r.fyMpa}</td>
            <td className="r mono val-conv">{r.fyKsi}</td>
            <td className="r mono">{r.fuMpa}</td>
            <td className="r mono val-conv">{r.fuKsi}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Steel grade (Fy/Fu/E) reference, per standard: `standard` is 'astm'
 * (AISC Manual Table 2-4/2-5) or 'ks' (KS D 3503/3515/3566/3568) — same
 * AISC/KS split pattern as the Bolt/Rod Bar sidebar entries. Reference
 * only: this app is a lookup DB, not a strength-check engine, so these
 * values aren't wired into any φMn/φPn calculation. */
export default function MaterialsView({ standard }) {
  const isKs = standard === 'ks';
  const d = isKs ? data.ks : data.astm;

  return (
    <>
      <div className="detail-head">
        <div><h1 className="mono">Steel Grades — {isKs ? 'KS' : 'ASTM'}</h1></div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>{isKs ? '강종 (Fy / Fu)' : 'Structural Steel Grades (Fy / Fu)'}</h2>
          <span className="tag">{d.rows.length} grades</span>
        </div>
        {isKs ? <KsTable rows={d.rows} /> : <AstmTable rows={d.rows} />}
        <p className="note">E = {isKs ? `${d.E_mpa.toLocaleString()} MPa (${d.E_ksi.toLocaleString()} ksi)` : `${d.E_ksi.toLocaleString()} ksi (${d.E_mpa.toLocaleString()} MPa)`} — 탄성계수(Young's modulus), 강종 공통</p>
        <p className="note">{d.source}</p>
        <p className="note">{d.note}</p>
      </div>
    </>
  );
}
