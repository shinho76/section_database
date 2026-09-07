import data from '../data/rodbar.json';
import { useStore } from '../store.js';

const KGM_PER_MM2 = 0.0061654; // kg/m per mm² of diameter-squared, density 7850 kg/m³
const LBFT_PER_IN2 = 2.6729;   // lb/ft per in² of diameter-squared, density 0.2836 lb/in³
const KG_PER_LB = 0.453592, M_PER_FT = 0.3048, MM_PER_IN = 25.4;

/** KS SS400 round bar: mm/kg-m are the calculated-native columns (KS D 3503 is
 * SI-native like the rest of this app's KS shapes); in/lb are conversions. */
function KsTable({ rows, addToBom }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th className="r">Diameter (mm)</th><th className="r">Diameter (in)</th>
          <th className="r">Unit Weight (kg/m)</th><th className="r">Unit Weight (lb/ft)</th><th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const kgm = KGM_PER_MM2 * r.diaMm * r.diaMm;
          const label = `D${r.diaMm}`;
          return (
            <tr key={r.diaMm}>
              <td className="r mono strong">{r.diaMm}</td>
              <td className="r mono val-conv">{(r.diaMm / MM_PER_IN).toFixed(3)}</td>
              <td className="r mono">{kgm.toFixed(3)}</td>
              <td className="r mono val-conv">{(kgm / KG_PER_LB * M_PER_FT).toFixed(3)}</td>
              <td>
                <button
                  type="button" className="bom-add-btn" title="물량 산정에 담기"
                  onClick={() => addToBom({ name: label, type: 'RODBAR-KS', unitWeightKgM: kgm })}
                >
                  +
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** ASTM A36 round bar: in/lb-ft are the calculated-native columns (imperial,
 * like AISC shapes); mm/kg-m are conversions. */
function AstmTable({ rows, addToBom }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th className="r">Diameter (in)</th><th className="r">Diameter (mm)</th>
          <th className="r">Unit Weight (lb/ft)</th><th className="r">Unit Weight (kg/m)</th><th />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const lbft = LBFT_PER_IN2 * r.diaIn * r.diaIn;
          const kgm = lbft * KG_PER_LB / M_PER_FT;
          return (
            <tr key={r.diaIn}>
              <td className="mono strong">{r.label}</td>
              <td className="r mono val-conv">{(r.diaIn * MM_PER_IN).toFixed(1)}</td>
              <td className="r mono">{lbft.toFixed(3)}</td>
              <td className="r mono val-conv">{kgm.toFixed(3)}</td>
              <td>
                <button
                  type="button" className="bom-add-btn" title="물량 산정에 담기"
                  onClick={() => addToBom({ name: r.label, type: 'RODBAR-ASTM', unitWeightKgM: kgm })}
                >
                  +
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Round bar (rod) unit-weight reference, per standard: `standard` is 'ks'
 * (KS D 3503 SS275 — the 2016-revised name for the former SS400, SI-native)
 * or 'astm' (ASTM A36, imperial-native) — same split pattern as the H-Shape
 * / Checked Plate sidebar entries. */
export default function RodBarView({ standard }) {
  const addToBom = useStore((s) => s.addToBom);
  const isKs = standard === 'ks';
  const d = isKs ? data.ks : data.astm;

  return (
    <>
      <div className="detail-head">
        <div><h1 className="mono">Rod Bar — {isKs ? 'KS D 3503 (SS275)' : 'ASTM A36'}</h1></div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>{isKs ? '환봉 (Round Bar)' : 'Round Bar (Sag Rod / Tie Rod)'}</h2>
          <span className="tag">{d.rows.length} sizes</span>
        </div>
        {isKs ? <KsTable rows={d.rows} addToBom={addToBom} /> : <AstmTable rows={d.rows} addToBom={addToBom} />}
        <p className="note">{d.source}</p>
        <p className="note">{d.note}</p>
      </div>
    </>
  );
}
