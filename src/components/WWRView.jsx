import { useEffect, useState } from 'react';

/** Standard Reinforcing Mesh Chart: common WWR styles by both the current
 * (D/W-size) and legacy (steel-wire-gauge) designations, with approximate
 * weight per 100 ft². lb/100ft² is the source value; kg/m² is this app's
 * conversion. */
function MeshChartTable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th>New Designation</th>
          <th>Old Designation (by steel wire gauge)</th>
          <th className="r">Weight (lb/100ft²)</th><th className="r">Weight (kg/m²)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td className="mono strong">{r.newDesignation}</td>
            <td className="mono ks">{r.oldDesignation}</td>
            <td className="r mono">{r.weightLbPer100ft2}</td>
            <td className="r mono val-conv">{r.weightKgM2}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** ASTM A1064/A1064M Table 1: Plain Wire, Inch-Pound units (diaIn/areaIn2 are
 * the standard's native values; mm columns are this app's conversion; the
 * standard doesn't publish a weight for plain wire at all, so both weight
 * columns are calculated here from A(in²) = W(lb/ft)/3.4). */
function PlainImperialTable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th>Size</th>
          <th className="r">Diameter (in)</th><th className="r">Diameter (mm)</th>
          <th className="r">Area (in²)</th><th className="r">Area (mm²)</th>
          <th className="r">Weight (lb/ft)</th><th className="r">Weight (kg/m)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.size}>
            <td className="mono strong">{r.size}</td>
            <td className="r mono">{r.diaIn}</td><td className="r mono val-conv">{r.diaMm}</td>
            <td className="r mono">{r.areaIn2}</td><td className="r mono val-conv">{r.areaMm2}</td>
            <td className="r mono val-conv">{r.weightLbFt}</td><td className="r mono val-conv">{r.weightKgM}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Table 2: Plain Wire, SI units — mm/mm² are native, in/in² are converted. */
function PlainSITable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th>Size</th>
          <th className="r">Diameter (mm)</th><th className="r">Diameter (in)</th>
          <th className="r">Area (mm²)</th><th className="r">Area (in²)</th>
          <th className="r">Weight (kg/m)</th><th className="r">Weight (lb/ft)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.size}>
            <td className="mono strong">{r.size}</td>
            <td className="r mono">{r.diaMm}</td><td className="r mono val-conv">{r.diaIn}</td>
            <td className="r mono">{r.areaMm2}</td><td className="r mono val-conv">{r.areaIn2}</td>
            <td className="r mono val-conv">{r.weightKgM}</td><td className="r mono val-conv">{r.weightLbFt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Table 3: Deformed Wire, Inch-Pound — weight(lb/ft)/diaIn/areaIn2 are the
 * standard's native values; kg/m is this app's conversion. */
function DeformedImperialTable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th>Size</th>
          <th className="r">Weight (lb/ft)</th><th className="r">Weight (kg/m)</th>
          <th className="r">Diameter (in)</th><th className="r">Area (in²)</th>
          <th className="r">Min. Deformation Height (in)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.size}>
            <td className="mono strong">{r.size}</td>
            <td className="r mono">{r.weightLbFt}</td><td className="r mono val-conv">{r.weightKgM}</td>
            <td className="r mono">{r.diaIn}</td><td className="r mono">{r.areaIn2}</td>
            <td className="r mono">{r.minDeformIn}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Table 4: Deformed Wire, SI — mass(kg/m)/diaMm/areaMm2 are the standard's
 * native values; lb/ft is this app's conversion. dEquiv is the bracketed
 * "[D x.x]" cross-reference the standard prints next to each MD size. */
function DeformedSITable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th>Size</th><th>≈ D Size</th>
          <th className="r">Mass (kg/m)</th><th className="r">Weight (lb/ft)</th>
          <th className="r">Diameter (mm)</th><th className="r">Area (mm²)</th>
          <th className="r">Min. Deformation Height (mm)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.size}>
            <td className="mono strong">{r.size}</td>
            <td className="mono ks">{r.dEquiv}</td>
            <td className="r mono">{r.weightKgM}</td><td className="r mono val-conv">{r.weightLbFt}</td>
            <td className="r mono">{r.diaMm}</td><td className="r mono">{r.areaMm2}</td>
            <td className="r mono">{r.minDeformMm}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function WWRView() {
  const [data, setData] = useState(null);

  useEffect(() => {
    import('../data/wwr.json').then((m) => setData(m.default));
  }, []);

  if (!data) return <div className="empty">불러오는 중…</div>;

  return (
    <>
      <div className="detail-head"><div><h1 className="mono">WWR — Welded Wire Reinforcement</h1></div></div>

      <div className="panel">
        <div className="panel-head">
          <h2>{data.meshChart.title} — Sheets</h2>
          <span className="tag">{data.meshChart.sheets.length} styles</span>
        </div>
        <MeshChartTable rows={data.meshChart.sheets} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>{data.meshChart.title} — Rolls</h2>
          <span className="tag">{data.meshChart.rolls.length} styles</span>
        </div>
        <MeshChartTable rows={data.meshChart.rolls} />
        <p className="note">{data.meshChart.note}</p>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Table 1 — Plain Wire, Inch-Pound Units</h2>
          <span className="tag">{data.plainImperial.length} sizes</span>
        </div>
        <PlainImperialTable rows={data.plainImperial} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Table 2 — Plain Wire, SI Units</h2>
          <span className="tag">{data.plainSI.length} sizes</span>
        </div>
        <PlainSITable rows={data.plainSI} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Table 3 — Deformed Wire, Inch-Pound Units</h2>
          <span className="tag">{data.deformedImperial.length} sizes</span>
        </div>
        <DeformedImperialTable rows={data.deformedImperial} />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Table 4 — Deformed Wire, SI Units</h2>
          <span className="tag">{data.deformedSI.length} sizes</span>
        </div>
        <DeformedSITable rows={data.deformedSI} />
      </div>

      <div className="panel">
        <div className="panel-head"><h2>자료 출처</h2></div>
        <p className="note">{data.source}</p>
        <p className="note">{data.note}</p>
        <p className="note">
          <a href={data.standardUrl} target="_blank" rel="noreferrer">{data.standardUrl}</a><br />
          <a href={data.productPdfUrl} target="_blank" rel="noreferrer">{data.productPdfUrl}</a><br />
          <a href={data.referenceUrl} target="_blank" rel="noreferrer">{data.referenceUrl}</a>
        </p>
      </div>
    </>
  );
}
