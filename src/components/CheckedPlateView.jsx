import { useMemo, useState } from 'react';
import data from '../data/checkedPlate.json';

const KG_TO_LB = 1 / 0.453592;
const KGM2_TO_PSF = 1 / 4.88243;
const IN_TO_MM = 25.4;

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
          <th className="r">4' × 8' Panel Weight (lb)</th><th className="r">4' × 8' Panel Weight (kg)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.gaugeLabel}>
            <td className="mono strong">{r.gaugeLabel}</td>
            <td className="r mono">{r.thicknessIn.toFixed(3)}</td><td className="r mono">{r.thicknessMm}</td>
            <td className="r mono">{r.psf.toFixed(2)}</td><td className="r mono">{r.kgm2.toFixed(2)}</td>
            <td className="r mono">{r.panel4x8Lb.toFixed(1)}</td><td className="r mono val-conv">{(r.panel4x8Lb * 0.453592).toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** KR checked-plate table (no active KS standard covers this product —
 * see checkedPlate.json's note): thicknessMm/kgm2/panel weights (kg) are
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

/** Weight calculator for one checked-plate thickness row: unlike a plain
 * flat plate (PlatePanel.jsx, thickness x STEEL_DENSITY), a checked/diamond
 * plate's unit weight is a real catalog/standard value (its raised pattern
 * makes it heavier than a flat plate of the same thickness) - so this uses
 * each row's own `kgm2` directly rather than any density formula. Thickness
 * is a dropdown restricted to the rows actually in the table (no
 * catalog-thickness guessing); width/length follow the same
 * none -> area load / one -> line load / both -> total weight steps as
 * PlatePanel's calculator. `unit` matches the table's own native unit (in
 * for ASTM, mm for KS) so the width/length inputs read the same way as
 * every other dimension field on that page, not a unit switch of their own. */
function WeightCalc({ rows, rowLabel, unit }) {
  const [rowIdx, setRowIdx] = useState(0);
  const [wVal, setWVal] = useState('');
  const [lVal, setLVal] = useState('');
  const row = rows[rowIdx];
  const step = unit === 'in' ? 0.01 : 1;
  const toMm = (v) => (unit === 'in' ? v * IN_TO_MM : v);

  const result = useMemo(() => {
    const kgm2 = row.kgm2;
    const wM = wVal ? toMm(Number(wVal)) / 1000 : null;
    const lM = lVal ? toMm(Number(lVal)) / 1000 : null;
    if (wM && lM) {
      const totalKg = kgm2 * wM * lM;
      return { mode: 'weight', totalKg, totalLb: totalKg * KG_TO_LB, kgm2 };
    }
    if (wM || lM) {
      const kgm = kgm2 * (wM || lM);
      return { mode: 'lineLoad', kgm, plf: kgm / 1.48816, dimUsed: wM ? '가로' : '세로', kgm2 };
    }
    return { mode: 'areaLoad', kgm2, psf: kgm2 * KGM2_TO_PSF };
  }, [row, wVal, lVal, unit]);

  return (
    <div className="panel">
      <div className="panel-head"><h2>무게 계산기</h2></div>
      <div className="field-row">
        <label><span className="field-label">두께</span>
          <select value={rowIdx} onChange={(e) => setRowIdx(Number(e.target.value))}>
            {rows.map((r, i) => <option key={rowLabel(r)} value={i}>{rowLabel(r)}</option>)}
          </select>
        </label>
        <label><span className="field-label">가로 (Width)</span>
          <span className="unit-input">
            <input type="number" min={0} step={step} placeholder="선택" value={wVal} onChange={(e) => setWVal(e.target.value)} />
            <span className="unit-suffix">{unit}</span>
          </span>
        </label>
        <label><span className="field-label">세로 (Length)</span>
          <span className="unit-input">
            <input type="number" min={0} step={step} placeholder="선택" value={lVal} onChange={(e) => setLVal(e.target.value)} />
            <span className="unit-suffix">{unit}</span>
          </span>
        </label>
      </div>
      <p className="note" style={{ borderTop: 'none' }}>
        두께만 선택 → 면적당 하중(kg/m²/psf) · 가로 또는 세로 하나만 입력 → 길이당 하중(kg/m·plf) · 둘 다 입력 → 총 무게(kg/lb). {rowLabel(row)} 두께의 실측 단위중량({row.kgm2.toFixed(2)} kg/m²)을 그대로 사용합니다(평철판 밀도 계산이 아님).
      </p>
      <figure className="panel draw" style={{ borderTop: 'none' }}>
        <figcaption className="draw-cap">단위중량<span>UNIT WEIGHT</span></figcaption>
        <div className="weight">
          <span className="wv mono">{result.kgm2.toFixed(2)}</span><span className="wu">kg/m²</span>
          {result.mode === 'areaLoad' && (
            <><span className="wv mono val-conv" style={{ marginLeft: 14 }}>{result.psf.toFixed(2)}</span><span className="wu val-conv">psf</span></>
          )}
          {result.mode === 'lineLoad' && (
            <>
              <span className="wv mono" style={{ marginLeft: 24 }}>{result.kgm.toFixed(1)}</span><span className="wu">kg/m (w')</span>
              <span className="wv mono val-conv" style={{ marginLeft: 14 }}>{result.plf.toFixed(2)}</span><span className="wu val-conv">plf (w')</span>
            </>
          )}
          {result.mode === 'weight' && (
            <>
              <span className="wv mono" style={{ marginLeft: 24 }}>{result.totalKg.toFixed(1)}</span><span className="wu">kg (W)</span>
              <span className="wv mono val-conv" style={{ marginLeft: 14 }}>{result.totalLb.toFixed(1)}</span><span className="wu val-conv">lb (W)</span>
            </>
          )}
        </div>
      </figure>
    </div>
  );
}

/** Checked/diamond-plate unit-weight reference, per standard: `standard`
 * is 'astm' (ASTM A786, imperial-native) or 'ks' (KR manufacturer spec,
 * SI-native — the old KS D 3633 standard was abolished in 2013) — same
 * AISC/KS split pattern as the H-Shape sidebar entries. */
export default function CheckedPlateView({ standard }) {
  const isKs = standard === 'ks';
  const d = isKs ? data.ks : data.astm;

  return (
    <>
      <div className="detail-head">
        <div><h1 className="mono">Checked Plate — {isKs ? 'KR (제조사 규격)' : 'ASTM A786'}</h1></div>
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

      <WeightCalc rows={d.rows} rowLabel={isKs ? (r) => `${r.thicknessMm}mm` : (r) => r.gaugeLabel} unit={isKs ? 'mm' : 'in'} />
    </>
  );
}
