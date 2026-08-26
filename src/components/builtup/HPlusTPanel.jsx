import { useEffect, useMemo, useState } from 'react';
import { manualHProps, manualTProps, composeSection, IN_TO_MM, IN2_TO_MM2, IN4_TO_MM4, LBFT_TO_KGM } from './compose.js';
import { loadType } from '../../lib/dataLoader.js';
import { displayType } from '../../store.js';
import { drawHPlusTSVG } from '../../lib/sectionSvg.js';
import BHDimTable from './BHDimTable.jsx';

const MM_TO_IN = 1 / 25.4;
const H_TYPES = ['W', 'M', 'S', 'HP', 'KSH'];

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

/** BH modes 2 & 3: a T-bar welded stem-down onto an H-shape's top flange.
 * baseKind 'db' selects the H from the AISC/KS database; 'custom' uses the
 * 4-number custom H (same inputs as CustomHPanel). Either way the T-bar
 * itself is always fully parametric (d/bf/tw/tf editable in mm). */
export default function HPlusTPanel({ baseKind }) {
  const [dbType, setDbType] = useState('W');
  const [dbShapes, setDbShapes] = useState([]);
  const [dbName, setDbName] = useState('');
  const [customH, setCustomH] = useState({ d: 400, bf: 200, tw: 7.9375, tf: 12.7 });
  const [tBar, setTBar] = useState({ d: 150, bf: 150, tw: 7.9375, tf: 12.7 });

  useEffect(() => {
    if (baseKind !== 'db') return;
    loadType(dbType).then(setDbShapes);
    setDbName('');
  }, [baseKind, dbType]);

  const setCustomField = (field) => (v) => setCustomH((m) => ({ ...m, [field]: v }));
  const setTField = (field) => (v) => setTBar((m) => ({ ...m, [field]: v }));

  const dbShape = baseKind === 'db' ? dbShapes.find((s) => s.name === dbName) : null;

  const hDimsIn = useMemo(() => {
    if (baseKind === 'db') {
      if (!dbShape) return null;
      return {
        d: parseFloat(dbShape.us.d), bf: parseFloat(dbShape.us.bf ?? dbShape.us.B),
        tw: parseFloat(dbShape.us.tw), tf: parseFloat(dbShape.us.tf),
      };
    }
    return { d: customH.d * MM_TO_IN, bf: customH.bf * MM_TO_IN, tw: customH.tw * MM_TO_IN, tf: customH.tf * MM_TO_IN };
  }, [baseKind, dbShape, customH]);

  const hDimsMm = useMemo(() => {
    if (baseKind === 'db') {
      if (!dbShape) return null;
      return {
        d: parseFloat(dbShape.mt.d), bf: parseFloat(dbShape.mt.bf ?? dbShape.mt.B),
        tw: parseFloat(dbShape.mt.tw), tf: parseFloat(dbShape.mt.tf),
      };
    }
    return customH;
  }, [baseKind, dbShape, customH]);

  const hPropsIn = useMemo(() => {
    if (!hDimsIn) return null;
    if (baseKind === 'db') {
      return {
        A: parseFloat(dbShape.us.A), Ix: parseFloat(dbShape.us.Ix), Iy: parseFloat(dbShape.us.Iy),
        W: parseFloat(dbShape.us.W), d: hDimsIn.d, bf: hDimsIn.bf, tw: hDimsIn.tw, tf: hDimsIn.tf,
      };
    }
    return manualHProps(hDimsIn);
  }, [hDimsIn, baseKind, dbShape]);

  const tDimsIn = useMemo(() => ({
    d: tBar.d * MM_TO_IN, bf: tBar.bf * MM_TO_IN, tw: tBar.tw * MM_TO_IN, tf: tBar.tf * MM_TO_IN,
  }), [tBar]);
  const tPropsIn = useMemo(() => manualTProps(tDimsIn), [tDimsIn]);

  const tValid = tBar.d > tBar.tf && tBar.bf > tBar.tw && tBar.d > 0 && tBar.bf > 0 && tBar.tw > 0 && tBar.tf > 0;

  const composite = useMemo(() => {
    if (!hPropsIn || !tValid) return null;
    const layers = [
      { yOffset: 0, props: hPropsIn },
      { yOffset: hPropsIn.d / 2 + tPropsIn.yBotExtent, props: tPropsIn },
    ];
    return composeSection(layers);
  }, [hPropsIn, tPropsIn, tValid]);

  const svgUs = hDimsIn && tValid ? drawHPlusTSVG(hDimsIn, tDimsIn, '"') : null;
  const svgMm = hDimsMm && tValid ? drawHPlusTSVG(hDimsMm, tBar, 'mm') : null;

  const title = baseKind === 'db' ? 'Rolled H-Section + T-Bar' : 'Built-up H-Shape + T-Bar';

  return (
    <>
      <div className="detail-head"><div><h1 className="mono">{title}</h1></div></div>

      <div className="bh-input-row">
        <div>
          <div className="panel">
            <div className="panel-head"><h2>기준 H-SHAPE</h2></div>
            {baseKind === 'db' ? (
              <div className="field-row">
                <label>Type
                  <select value={dbType} onChange={(e) => setDbType(e.target.value)}>
                    {H_TYPES.map((t) => <option key={t} value={t}>{displayType(t)}</option>)}
                  </select>
                </label>
                <label>Shape
                  <select value={dbName} onChange={(e) => setDbName(e.target.value)}>
                    <option value="">선택…</option>
                    {dbShapes.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </label>
              </div>
            ) : (
              <div style={{ padding: 14 }}>
                <BHDimTable fields={H_FIELDS} mm={customH} onChangeMm={setCustomField} />
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-head"><h2>T-BAR (용접 부재, 자유 입력)</h2></div>
            <div style={{ padding: 14 }}>
              <BHDimTable fields={T_FIELDS} mm={tBar} onChangeMm={setTField} />
            </div>
            {!tValid && <p className="note">T-BAR 치수가 유효하지 않습니다.</p>}
            <p className="note">T-BAR 높이(d)를 바꾸면 tw를 자유롭게 조정해 웹 접합부에 맞출 수 있습니다. H의 상부 플랜지 위에 T의 웨브(스템)를 용접하는 방식입니다.</p>
          </div>
        </div>

        {svgUs && svgMm && composite && (
          <>
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
          </>
        )}
      </div>

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
