import { useEffect, useMemo, useState } from 'react';
import { manualHProps, manualTProps, composeSection, IN_TO_MM, IN2_TO_MM2, IN4_TO_MM4, LBFT_TO_KGM } from './compose.js';
import { loadType } from '../../lib/dataLoader.js';
import { drawHPlusTSVG } from '../../lib/sectionSvg.js';

const MM_TO_IN = 1 / 25.4;
const H_TYPES = ['W', 'M', 'S', 'HP', 'KSH'];

/** BH modes 2 & 3: a T-bar welded stem-down onto an H-shape's top flange.
 * baseKind 'db' selects the H from the AISC/KS database; 'custom' uses the
 * 4-number custom H (same inputs as CustomHPanel). Either way the T-bar
 * itself is always fully parametric (d/bf/tw/tf editable in mm). */
export default function HPlusTPanel({ baseKind }) {
  const [dbType, setDbType] = useState('W');
  const [dbShapes, setDbShapes] = useState([]);
  const [dbName, setDbName] = useState('');
  const [customH, setCustomH] = useState({ d: 400, bf: 200, tw: 8, tf: 12 });
  const [tBar, setTBar] = useState({ d: 150, bf: 150, tw: 8, tf: 12 });

  useEffect(() => {
    if (baseKind !== 'db') return;
    loadType(dbType).then(setDbShapes);
    setDbName('');
  }, [baseKind, dbType]);

  const setCustomField = (field) => (e) => {
    const v = parseFloat(e.target.value) || 0;
    setCustomH((m) => ({ ...m, [field]: v }));
  };
  const setTField = (field) => (e) => {
    const v = parseFloat(e.target.value) || 0;
    setTBar((m) => ({ ...m, [field]: v }));
  };

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

  return (
    <>
      <div className="bh-grid">
        <div className="panel">
          <div className="panel-head"><h2>기준 H-SHAPE</h2></div>
          {baseKind === 'db' ? (
            <div className="field-row">
              <label>Type
                <select value={dbType} onChange={(e) => setDbType(e.target.value)}>
                  {H_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
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
            <div className="field-row">
              <label>d (mm)<input type="number" value={customH.d} onChange={setCustomField('d')} /></label>
              <label>bf (mm)<input type="number" value={customH.bf} onChange={setCustomField('bf')} /></label>
              <label>tw (mm)<input type="number" value={customH.tw} onChange={setCustomField('tw')} /></label>
              <label>tf (mm)<input type="number" value={customH.tf} onChange={setCustomField('tf')} /></label>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head"><h2>T-BAR (용접 부재, 자유 입력)</h2></div>
          <div className="field-row">
            <label>T d — 높이 (mm)<input type="number" value={tBar.d} onChange={setTField('d')} /></label>
            <label>T bf — 폭 (mm)<input type="number" value={tBar.bf} onChange={setTField('bf')} /></label>
            <label>T tw — 웹 두께 (mm)<input type="number" value={tBar.tw} onChange={setTField('tw')} /></label>
            <label>T tf — 플랜지 두께 (mm)<input type="number" value={tBar.tf} onChange={setTField('tf')} /></label>
          </div>
          {!tValid && <p className="note">T-BAR 치수가 유효하지 않습니다.</p>}
          <p className="note">T-BAR 높이(d)를 바꾸면 tw를 자유롭게 조정해 웹 접합부에 맞출 수 있습니다. H의 상부 플랜지 위에 T의 웨브(스템)를 용접하는 방식입니다.</p>
        </div>
      </div>

      {svgUs && svgMm && (
        <div className="draw-grid">
          <figure className="panel draw">
            <figcaption className="draw-cap">Imperial<span>inch</span></figcaption>
            <div dangerouslySetInnerHTML={{ __html: svgUs }} />
          </figure>
          <figure className="panel draw">
            <figcaption className="draw-cap">Metric<span>mm</span></figcaption>
            <div dangerouslySetInnerHTML={{ __html: svgMm }} />
          </figure>
        </div>
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
          <p className="note">⚠ 계산값입니다 (필렛·용접부 미고려). T-BAR는 H의 상부 플랜지 외측면에 스템을 맞대어 용접하는 것으로 가정합니다.</p>
        </div>
      )}
    </>
  );
}
