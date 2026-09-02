import data from '../data/bolt.json';

const KIPS_PER_KN = 0.224809;
const KN_PER_KIPS = 1 / KIPS_PER_KN;
const MM_PER_IN = 25.4;

/** ASTM F3125 A325/A490: kips values are the AISC J3.1 native table; kN is
 * this app's conversion. */
function AstmTable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th>Nominal Dia.</th><th className="r">Dia. (mm)</th>
          <th className="r">A325 Min. Pretension (kips)</th><th className="r">A325 (kN)</th>
          <th className="r">A490 Min. Pretension (kips)</th><th className="r">A490 (kN)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label}>
            <td className="mono strong">{r.label}</td>
            <td className="r mono val-conv">{(r.diaIn * MM_PER_IN).toFixed(1)}</td>
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
          <th>호칭 (Nominal)</th><th className="r">호칭경 (in)</th><th className="r">유효단면적 As (mm²)</th>
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
              <td className="r mono val-conv">{(r.diaMm / MM_PER_IN).toFixed(3)}</td>
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

/** AISC Table J3.3 hole dimensions: in. values are the table's native
 * column, mm is this app's conversion. */
function HoleDiaTable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th>Bolt Dia.</th>
          <th className="r">Standard (in)</th><th className="r">Standard (mm)</th>
          <th className="r">Oversize (in)</th><th className="r">Short-Slot L (in)</th><th className="r">Long-Slot L (in)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label}>
            <td className="mono strong">{r.label}</td>
            <td className="r mono">{r.stdIn.toFixed(4)}</td>
            <td className="r mono val-conv">{(r.stdIn * MM_PER_IN).toFixed(1)}</td>
            <td className="r mono">{r.overIn.toFixed(4)}</td>
            <td className="r mono">{r.shortSlotLIn.toFixed(4)}</td>
            <td className="r mono">{r.longSlotLIn.toFixed(4)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** AISC Table J3.4 minimum edge distance: in. values are the table's
 * native column, mm is this app's conversion. */
function EdgeDistanceTable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th>Bolt Dia.</th>
          <th className="r">Sheared Edge (in)</th><th className="r">Sheared Edge (mm)</th>
          <th className="r">Rolled/Gas-Cut Edge (in)</th><th className="r">Rolled/Gas-Cut Edge (mm)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label}>
            <td className="mono strong">{r.label}</td>
            <td className="r mono">{r.shearedIn.toFixed(4)}</td>
            <td className="r mono val-conv">{(r.shearedIn * MM_PER_IN).toFixed(1)}</td>
            <td className="r mono">{r.rolledIn.toFixed(4)}</td>
            <td className="r mono val-conv">{(r.rolledIn * MM_PER_IN).toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** AISC Table J3.2 nominal/design fastener strength: ksi is the table's
 * native column, MPa is this app's conversion. */
function DesignStrengthTable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th>Grade</th>
          <th className="r">Fnt (ksi)</th><th className="r">φFnt (ksi)</th>
          <th className="r">Fnv-N (ksi)</th><th className="r">φFnv-N (ksi)</th>
          <th className="r">Fnv-X (ksi)</th><th className="r">φFnv-X (ksi)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.grade}>
            <td className="mono strong">{r.grade}</td>
            <td className="r mono">{r.fntKsi}</td><td className="r mono">{r.phiFntKsi}</td>
            <td className="r mono">{r.fnvNKsi}</td><td className="r mono">{r.phiFnvNKsi}</td>
            <td className="r mono">{r.fnvXKsi}</td><td className="r mono">{r.phiFnvXKsi}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** High-strength structural bolt reference, per standard: `standard` is
 * 'astm' (ASTM F3125 A325/A490) or 'ks' (KS B 1010/2819 F8T/F10T). The
 * hole-dimension/edge-distance/spacing/design-strength tables below are
 * AISC-only (Table J3.2/J3.3/J3.4) — the KS-side equivalents haven't been
 * verified against KDS 14 31 25 yet, see bolt.json's ks.designNote. */
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

      {isKs ? (
        <div className="panel">
          <div className="panel-head"><h2>구멍경 · 연단거리 · 피치 · 설계강도</h2></div>
          <p className="note" style={{ borderTop: 'none' }}>{data.ks.designNote}</p>
        </div>
      ) : (
        <>
          <div className="panel">
            <div className="panel-head">
              <h2>Nominal Hole Dimensions</h2>
              <span className="tag">Table J3.3</span>
            </div>
            <HoleDiaTable rows={data.astm.holeDia.rows} />
            <p className="note">{data.astm.holeDia.source}</p>
            <p className="note">{data.astm.holeDia.note}</p>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Minimum Edge Distance</h2>
              <span className="tag">Table J3.4</span>
            </div>
            <EdgeDistanceTable rows={data.astm.edgeDistance.rows} />
            <p className="note">{data.astm.edgeDistance.source}</p>
            <p className="note">{data.astm.edgeDistance.note}</p>
            <p className="note">{data.astm.spacing.note}</p>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Design Strength of Fasteners</h2>
              <span className="tag">Table J3.2</span>
            </div>
            <DesignStrengthTable rows={data.astm.designStrength.rows} />
            <p className="note">{data.astm.designStrength.source}</p>
            <p className="note">{data.astm.designStrength.note}</p>
          </div>
        </>
      )}
    </>
  );
}
