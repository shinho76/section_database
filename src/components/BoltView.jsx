import data from '../data/bolt.json';

const KIPS_PER_KN = 0.224809;
const KN_PER_KIPS = 1 / KIPS_PER_KN;

/** ASTM F3125 A325/A490: kips values are the AISC J3.1 native table; kN is
 * this app's conversion. */
function AstmTable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th>Nominal Dia.</th>
          <th className="r">A325 Min. Pretension (kips)</th><th className="r">A325 (kN)</th>
          <th className="r">A490 Min. Pretension (kips)</th><th className="r">A490 (kN)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label}>
            <td className="mono strong">{r.label}</td>
            <td className="r mono">{r.a325Kips}</td>
            <td className="r mono val-conv">{(r.a325Kips * KN_PER_KIPS).toFixed(1)}</td>
            <td className="r mono">{r.a490Kips}</td>
            <td className="r mono val-conv">{(r.a490Kips * KN_PER_KIPS).toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** KS B 1010/2819 F8T/F10T: mm/kN are the calculated-native columns (SI);
 * kips is this app's conversion. Effective area per ISO 898-1. */
function KsTable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th>호칭 (Nominal)</th><th className="r">유효단면적 As (mm²)</th>
          <th className="r">F8T 최소인장하중 (kN)</th><th className="r">F8T (kips)</th>
          <th className="r">F10T 최소인장하중 (kN)</th><th className="r">F10T (kips)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const as = (Math.PI / 4) * (r.diaMm - 0.9382 * r.pitchMm) ** 2;
          const f8t = as * 800 / 1000, f10t = as * 1000 / 1000;
          return (
            <tr key={r.label}>
              <td className="mono strong">{r.label}</td>
              <td className="r mono">{as.toFixed(1)}</td>
              <td className="r mono">{f8t.toFixed(1)}</td>
              <td className="r mono val-conv">{(f8t * KIPS_PER_KN).toFixed(1)}</td>
              <td className="r mono">{f10t.toFixed(1)}</td>
              <td className="r mono val-conv">{(f10t * KIPS_PER_KN).toFixed(1)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** High-strength structural bolt reference, per standard: `standard` is
 * 'astm' (ASTM F3125 A325/A490) or 'ks' (KS B 1010/2819 F8T/F10T). */
export default function BoltView({ standard }) {
  const isKs = standard === 'ks';
  const d = isKs ? data.ks : data.astm;

  return (
    <>
      <div className="detail-head">
        <div><h1 className="mono">High-Strength Bolt — {isKs ? 'KS B 1010 / 2819' : 'ASTM F3125'}</h1></div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>{isKs ? '고장력볼트 (F8T · F10T)' : 'High-Strength Structural Bolt (A325 / A490)'}</h2>
          <span className="tag">{d.rows.length} sizes</span>
        </div>
        {isKs ? <KsTable rows={d.rows} /> : <AstmTable rows={d.rows} />}
        <p className="note">{d.source}</p>
        <p className="note">{d.note}</p>
      </div>
    </>
  );
}
