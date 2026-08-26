import { useMemo, useState } from 'react';
import { BHDimCards } from './builtup/BHDimTable.jsx';
import { STEEL_DENSITY_LB_FT3 } from './builtup/compose.js';

const MM_TO_FT = 1 / 304.8;
const PSF_TO_KGM2 = 4.88243;
const PLF_TO_KGM = 1.48816;
const LB_TO_KG = 0.453592;

const FIELDS = [
  { key: 't', label: '두께 (Thickness)', thickness: true },
  { key: 'w', label: '가로 (Width)' },
  { key: 'l', label: '세로 (Length)' },
];

export default function PlatePanel() {
  const [tMm, setTMm] = useState(9.525); // 3/8"
  const [wMm, setWMm] = useState(null); // 가로 (width)
  const [lMm, setLMm] = useState(null); // 세로 (length)

  const mm = { t: tMm, w: wMm, l: lMm };
  const setField = (field) => (v) => {
    if (field === 't') setTMm(v);
    else if (field === 'w') setWMm(v);
    else setLMm(v);
  };

  const result = useMemo(() => {
    if (!tMm) return null;
    const tFt = tMm * MM_TO_FT;
    const areaLoadPsf = tFt * STEEL_DENSITY_LB_FT3; // lb/ft^2

    const wFt = wMm ? wMm * MM_TO_FT : null;
    const lFt = lMm ? lMm * MM_TO_FT : null;

    if (wFt && lFt) {
      const totalLb = areaLoadPsf * wFt * lFt;
      return { mode: 'weight', totalLb, totalKg: totalLb * LB_TO_KG, areaLoadPsf };
    }
    if (wFt || lFt) {
      const plf = areaLoadPsf * (wFt || lFt);
      return { mode: 'lineLoad', plf, kgm: plf * PLF_TO_KGM, dimUsed: wFt ? '가로' : '세로', areaLoadPsf };
    }
    return { mode: 'areaLoad', areaLoadPsf, areaLoadKgm2: areaLoadPsf * PSF_TO_KGM2 };
  }, [tMm, wMm, lMm]);

  return (
    <>
      <div className="detail-head"><div><h1 className="mono">Plate</h1></div></div>

      <BHDimCards fields={FIELDS} mm={mm} onChangeMm={setField} />

      <div className="panel">
        <p className="note" style={{ borderTop: 'none' }}>
          두께만 입력 → 면적당 하중(psf/kg/m²) · 두께+가로 또는 두께+세로 하나만 입력 → 길이당 하중(plf/kg/m) · 셋 다 입력 → 총 무게(lb/kg)
        </p>
      </div>

      {result && (
        <figure className="panel draw">
          <figcaption className="draw-cap">단위중량<span>UNIT WEIGHT</span></figcaption>
          <div className="weight">
            <span className="wv mono">{result.areaLoadPsf.toFixed(2)}</span><span className="wu">psf</span>
            <span className="wv mono" style={{ marginLeft: 14 }}>{(result.areaLoadPsf * PSF_TO_KGM2).toFixed(1)}</span><span className="wu">kg/m²</span>
          </div>
        </figure>
      )}

      {result && (
        <div className="panel">
          <div className="panel-head"><h2>계산 결과</h2></div>
          <table className="props">
            <thead><tr><th>Symbol</th><th className="r">Imperial</th><th className="r">Metric</th><th>Description</th></tr></thead>
            <tbody>
              <tr>
                <td className="sym mono">w</td>
                <td className="r mono">{result.areaLoadPsf.toFixed(2)} <em>psf</em></td>
                <td className="r mono">{(result.areaLoadPsf * PSF_TO_KGM2).toFixed(1)} <em>kg/m²</em></td>
                <td className="desc">면적당 하중 (단위중량 × 두께)</td>
              </tr>
              {result.mode === 'lineLoad' && (
                <tr>
                  <td className="sym mono">w'</td>
                  <td className="r mono">{result.plf.toFixed(2)} <em>plf</em></td>
                  <td className="r mono">{result.kgm.toFixed(1)} <em>kg/m</em></td>
                  <td className="desc">길이당 하중 ({result.dimUsed} 기준 폭의 스트립)</td>
                </tr>
              )}
              {result.mode === 'weight' && (
                <tr>
                  <td className="sym mono">W</td>
                  <td className="r mono">{result.totalLb.toFixed(1)} <em>lb</em></td>
                  <td className="r mono">{result.totalKg.toFixed(1)} <em>kg</em></td>
                  <td className="desc">총 무게 (가로 × 세로 × 두께)</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
