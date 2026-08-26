import { useMemo, useState } from 'react';
import { manualHProps, manualTProps, composeSection, IN_TO_MM, IN2_TO_MM2, IN4_TO_MM4, LBFT_TO_KGM } from './compose.js';
import { displayType } from '../../store.js';
import { drawHPlusTSVG } from '../../lib/sectionSvg.js';
import BHDimTable from './BHDimTable.jsx';
import ShapeAutocomplete from './ShapeAutocomplete.jsx';

const MM_TO_IN = 1 / 25.4;
const H_TYPES = ['W', 'M', 'S', 'KSH'];
// AISC/KS tee paired with each H type - WT/MT/ST are literally an H cut in
// half, KST likewise from KSH, so this pairing is exact (HP has no tee).
const T_TYPE_FOR_H = { W: 'WT', M: 'MT', S: 'ST', KSH: 'KST' };

const H_FIELDS = [
  { key: 'd', label: 'd (높이)' },
  { key: 'bf', label: 'bf (폭)' },
  { key: 'tw', label: 'tw (두께)', thickness: true },
  { key: 'tf', label: 'tf (두께)', thickness: true },
];
const T_FIELDS = [
  { key: 'd', label: 'T d (높이)' },
  { key: 'bf', label: 'T bf (폭)' },
  { key: 'tw', label: 'T tw (두께)', thickness: true },
  { key: 'tf', label: 'T tf (두께)', thickness: true },
];

/** Section properties for a T pulled straight from the database. AISC WT/MT/ST
 * rows carry real Ix/Iy/y (distance from flange face to centroid); KST rows
 * only carry W/A, so its geometry (and therefore Ix/Iy/centroid) is derived
 * from d/bf/tw/tf via the same formula used for the fully-custom T-bar - the
 * real tabulated W/A are kept over the formula's estimate either way. */
function tPropsFromDbShape(t) {
  const d = parseFloat(t.us.d), bf = parseFloat(t.us.bf), tw = parseFloat(t.us.tw), tf = parseFloat(t.us.tf);
  const A = parseFloat(t.us.A), W = parseFloat(t.us.W);
  if (t.us.Ix !== undefined && t.us.y !== undefined) {
    const y = parseFloat(t.us.y);
    return { A, Ix: parseFloat(t.us.Ix), Iy: parseFloat(t.us.Iy), W, d, bf, tw, tf, yTopExtent: y, yBotExtent: d - y };
  }
  const geo = manualTProps({ d, bf, tw, tf });
  return { ...geo, A: A || geo.A, W: W || geo.W, d, bf, tw, tf };
}

/** BH modes 3 & 4: a T-bar welded stem-down onto an H-shape's top flange.
 * baseKind 'db' picks both the H and its paired T (WT/MT/ST/KST) from the
 * database via search-as-you-type; 'custom' uses the 4-number custom H
 * (same inputs as CustomHPanel) with a fully free-parametric T-bar. */
export default function HPlusTPanel({ baseKind }) {
  const [hType, setHType] = useState('W');
  const [hShape, setHShape] = useState(null);
  const [tShape, setTShape] = useState(null);
  const [customH, setCustomH] = useState({ d: 400, bf: 200, tw: 7.9375, tf: 12.7 });
  const [tBar, setTBar] = useState({ d: 150, bf: 150, tw: 7.9375, tf: 12.7 });

  const setCustomField = (field) => (v) => setCustomH((m) => ({ ...m, [field]: v }));
  const setTField = (field) => (v) => setTBar((m) => ({ ...m, [field]: v }));

  const onPickH = (s) => { setHShape(s); setTShape(null); };
  const onHTypeChange = (t) => { setHType(t); setHShape(null); setTShape(null); };

  const hDimsIn = useMemo(() => {
    if (baseKind === 'db') {
      if (!hShape) return null;
      return {
        d: parseFloat(hShape.us.d), bf: parseFloat(hShape.us.bf ?? hShape.us.B),
        tw: parseFloat(hShape.us.tw), tf: parseFloat(hShape.us.tf),
      };
    }
    return { d: customH.d * MM_TO_IN, bf: customH.bf * MM_TO_IN, tw: customH.tw * MM_TO_IN, tf: customH.tf * MM_TO_IN };
  }, [baseKind, hShape, customH]);

  const hDimsMm = useMemo(() => {
    if (baseKind === 'db') {
      if (!hShape) return null;
      return {
        d: parseFloat(hShape.mt.d), bf: parseFloat(hShape.mt.bf ?? hShape.mt.B),
        tw: parseFloat(hShape.mt.tw), tf: parseFloat(hShape.mt.tf),
      };
    }
    return customH;
  }, [baseKind, hShape, customH]);

  const hPropsIn = useMemo(() => {
    if (!hDimsIn) return null;
    if (baseKind === 'db') {
      return {
        A: parseFloat(hShape.us.A), Ix: parseFloat(hShape.us.Ix), Iy: parseFloat(hShape.us.Iy),
        W: parseFloat(hShape.us.W), d: hDimsIn.d, bf: hDimsIn.bf, tw: hDimsIn.tw, tf: hDimsIn.tf,
      };
    }
    return manualHProps(hDimsIn);
  }, [hDimsIn, baseKind, hShape]);

  const tDimsInCustom = useMemo(() => ({
    d: tBar.d * MM_TO_IN, bf: tBar.bf * MM_TO_IN, tw: tBar.tw * MM_TO_IN, tf: tBar.tf * MM_TO_IN,
  }), [tBar]);

  const tPropsIn = useMemo(() => {
    if (baseKind === 'db') return tShape ? tPropsFromDbShape(tShape) : null;
    return manualTProps(tDimsInCustom);
  }, [baseKind, tShape, tDimsInCustom]);

  const tDimsIn = baseKind === 'db'
    ? (tPropsIn ? { d: tPropsIn.d, bf: tPropsIn.bf, tw: tPropsIn.tw, tf: tPropsIn.tf } : null)
    : tDimsInCustom;
  const tDimsMm = baseKind === 'db'
    ? (tShape ? { d: parseFloat(tShape.mt.d), bf: parseFloat(tShape.mt.bf), tw: parseFloat(tShape.mt.tw), tf: parseFloat(tShape.mt.tf) } : null)
    : tBar;

  const tValid = baseKind === 'db'
    ? !!tPropsIn
    : tBar.d > tBar.tf && tBar.bf > tBar.tw && tBar.d > 0 && tBar.bf > 0 && tBar.tw > 0 && tBar.tf > 0;

  const composite = useMemo(() => {
    if (!hPropsIn || !tPropsIn || !tValid) return null;
    const layers = [
      { yOffset: 0, props: hPropsIn },
      { yOffset: hPropsIn.d / 2 + tPropsIn.yBotExtent, props: tPropsIn },
    ];
    return composeSection(layers);
  }, [hPropsIn, tPropsIn, tValid]);

  const svgUs = hDimsIn && tDimsIn && tValid ? drawHPlusTSVG(hDimsIn, tDimsIn, '"') : null;
  const svgMm = hDimsMm && tDimsMm && tValid ? drawHPlusTSVG(hDimsMm, tDimsMm, 'mm') : null;

  const title = baseKind === 'db' ? 'Rolled H-Section + T-Bar' : 'Built-up H-Shape + T-Bar';
  const tType = T_TYPE_FOR_H[hType];

  return (
    <>
      <div className="detail-head"><div><h1 className="mono">{title}</h1></div></div>

      {baseKind === 'db' ? (
        <div className="rolled-row">
          <div className="panel panel-combo">
            <div className="panel-head"><h2>H-SHAPE + T-BAR 선택</h2></div>
            <div className="field-row">
              <label>Type
                <select value={hType} onChange={(e) => onHTypeChange(e.target.value)}>
                  {H_TYPES.map((t) => <option key={t} value={t}>{displayType(t)}</option>)}
                </select>
              </label>
              <label>H-SHAPE (검색)
                <ShapeAutocomplete type={hType} onSelect={onPickH} placeholder={`${hType} 형강 검색…`} />
              </label>
            </div>
            <div className="field-row">
              <label>T-BAR — {displayType(tType)} (검색)
                <ShapeAutocomplete
                  key={tType}
                  type={tType}
                  onSelect={setTShape}
                  placeholder={hShape ? `${tType} 검색…` : '먼저 H-SHAPE를 선택하세요'}
                />
              </label>
            </div>
            {!hShape && <p className="note">H-SHAPE를 먼저 선택하면 짝이 되는 {displayType(tType)}에서 검색할 수 있습니다.</p>}
          </div>

          <figure className="panel draw">
            <figcaption className="draw-cap">Imperial<span>inch</span></figcaption>
            {svgUs ? (
              <>
                <div dangerouslySetInnerHTML={{ __html: svgUs }} />
                {composite && (
                  <div className="weight">
                    <span className="wv mono">{composite.W.toFixed(1)}</span><span className="wu">lb/ft</span>
                    <span className="wv mono" style={{ marginLeft: 14 }}>{composite.A.toFixed(2)}</span><span className="wu">in²</span>
                  </div>
                )}
              </>
            ) : <p className="note">H-SHAPE와 T-BAR를 선택하면 단면도가 표시됩니다.</p>}
          </figure>
          <figure className="panel draw">
            <figcaption className="draw-cap">Metric<span>mm</span></figcaption>
            {svgMm ? (
              <>
                <div dangerouslySetInnerHTML={{ __html: svgMm }} />
                {composite && (
                  <div className="weight">
                    <span className="wv mono">{(composite.W * LBFT_TO_KGM).toFixed(1)}</span><span className="wu">kg/m</span>
                    <span className="wv mono" style={{ marginLeft: 14 }}>{(composite.A * IN2_TO_MM2).toFixed(0)}</span><span className="wu">mm²</span>
                  </div>
                )}
              </>
            ) : <p className="note">H-SHAPE와 T-BAR를 선택하면 단면도가 표시됩니다.</p>}
          </figure>
        </div>
      ) : (
        <>
          <div className="panel">
            <div className="panel-head"><h2>기준 H-SHAPE</h2></div>
            <div style={{ padding: 14 }}>
              <BHDimTable fields={H_FIELDS} mm={customH} onChangeMm={setCustomField} />
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h2>T-BAR (용접 부재, 자유 입력)</h2></div>
            <div style={{ padding: 14 }}>
              <BHDimTable fields={T_FIELDS} mm={tBar} onChangeMm={setTField} />
            </div>
            {!tValid && <p className="note">T-BAR 치수가 유효하지 않습니다.</p>}
            <p className="note">T-BAR 높이(d)를 바꾸면 tw를 자유롭게 조정해 웹 접합부에 맞출 수 있습니다. H의 상부 플랜지 위에 T의 웨브(스템)를 용접하는 방식입니다.</p>
          </div>

          {svgUs && svgMm && composite && (
            <div className="draw-grid">
              <figure className="panel draw">
                <figcaption className="draw-cap">Imperial<span>inch</span></figcaption>
                <div dangerouslySetInnerHTML={{ __html: svgUs }} />
                <div className="weight">
                  <span className="wv mono">{composite.W.toFixed(1)}</span><span className="wu">lb/ft</span>
                  <span className="wv mono" style={{ marginLeft: 14 }}>{composite.A.toFixed(2)}</span><span className="wu">in²</span>
                </div>
              </figure>
              <figure className="panel draw">
                <figcaption className="draw-cap">Metric<span>mm</span></figcaption>
                <div dangerouslySetInnerHTML={{ __html: svgMm }} />
                <div className="weight">
                  <span className="wv mono">{(composite.W * LBFT_TO_KGM).toFixed(1)}</span><span className="wu">kg/m</span>
                  <span className="wv mono" style={{ marginLeft: 14 }}>{(composite.A * IN2_TO_MM2).toFixed(0)}</span><span className="wu">mm²</span>
                </div>
              </figure>
            </div>
          )}
        </>
      )}

      {composite && (
        <div className="panel">
          <div className="panel-head"><h2>합성 단면성능 (계산값)</h2></div>
          <table className="props">
            <thead><tr><th>Symbol</th><th className="r">Imperial</th><th className="r">Metric</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td className="sym mono">A</td><td className="r mono">{composite.A.toFixed(2)} <em>in²</em></td><td className="r mono">{(composite.A * IN2_TO_MM2).toFixed(0)} <em>mm²</em></td><td className="desc">단면적</td></tr>
              <tr><td className="sym mono">Ix</td><td className="r mono">{composite.Ix.toFixed(1)} <em>in⁴</em></td><td className="r mono">{(composite.Ix * IN4_TO_MM4 / 1e6).toFixed(1)} <em>×10⁶ mm⁴</em></td><td className="desc">x축 관성모멘트 (합성 도심 기준)</td></tr>
              <tr><td className="sym mono">Iy</td><td className="r mono">{composite.Iy.toFixed(1)} <em>in⁴</em></td><td className="r mono">{(composite.Iy * IN4_TO_MM4 / 1e6).toFixed(1)} <em>×10⁶ mm⁴</em></td><td className="desc">y축 관성모멘트</td></tr>
              <tr><td className="sym mono">rx</td><td className="r mono">{composite.rx.toFixed(2)} <em>in</em></td><td className="r mono">{(composite.rx * IN_TO_MM).toFixed(0)} <em>mm</em></td><td className="desc">x축 회전반경</td></tr>
              <tr><td className="sym mono">ry</td><td className="r mono">{composite.ry.toFixed(2)} <em>in</em></td><td className="r mono">{(composite.ry * IN_TO_MM).toFixed(0)} <em>mm</em></td><td className="desc">y축 회전반경</td></tr>
              {composite.Sx_top && <tr><td className="sym mono">Sx(top)</td><td className="r mono">{composite.Sx_top.toFixed(1)} <em>in³</em></td><td className="r mono">{(composite.Sx_top * IN4_TO_MM4 / IN_TO_MM / 1e3).toFixed(1)} <em>×10³ mm³</em></td><td className="desc">상연(T측) 단면계수</td></tr>}
              {composite.Sx_bot && <tr><td className="sym mono">Sx(bot)</td><td className="r mono">{composite.Sx_bot.toFixed(1)} <em>in³</em></td><td className="r mono">{(composite.Sx_bot * IN4_TO_MM4 / IN_TO_MM / 1e3).toFixed(1)} <em>×10³ mm³</em></td><td className="desc">하연(H측) 단면계수</td></tr>}
              <tr><td className="sym mono">W</td><td className="r mono">{composite.W.toFixed(1)} <em>lb/ft</em></td><td className="r mono">{(composite.W * LBFT_TO_KGM).toFixed(1)} <em>kg/m</em></td><td className="desc">단위중량 (H + T)</td></tr>
            </tbody>
          </table>
          <p className="note">⚠ 계산값입니다 (필렛·용접부 미고려). T-BAR는 H의 상부 플랜지 외측면에 스템을 맞대어 용접하는 것으로 가정합니다. A572 GR50/A36 표기는 두께에 따른 일반적 유통 규격 안내이며, 실제 조달 가능 여부는 제작사에 확인하시기 바랍니다.</p>
        </div>
      )}
    </>
  );
}
