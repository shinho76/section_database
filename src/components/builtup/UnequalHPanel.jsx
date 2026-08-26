import { useMemo, useState } from 'react';
import { manualHUnequalProps, IN2_TO_MM2, IN4_TO_MM4, LBFT_TO_KGM } from './compose.js';
import { drawUnequalHSVG, fmtDim } from '../../lib/sectionSvg.js';
import { BHDimCards } from './BHDimTable.jsx';

const MM_TO_IN = 1 / 25.4;

const FIELDS = [
  { key: 'd', label: 'd (높이)' },
  { key: 'bfTop', label: 'bf-top (폭)' },
  { key: 'tfTop', label: 'tf-top (두께)', thickness: true },
  { key: 'bfBot', label: 'bf-bot (폭)' },
  { key: 'tfBot', label: 'tf-bot (두께)', thickness: true },
  { key: 'tw', label: 'tw (두께)', thickness: true },
];

export default function UnequalHPanel() {
  const [mm, setMm] = useState({ d: 400, tw: 7.9375, bfTop: 200, tfTop: 12.7, bfBot: 150, tfBot: 15.875 });
  const set = (field) => (v) => setMm((m) => ({ ...m, [field]: v }));

  const dimsIn = useMemo(() => ({
    d: mm.d * MM_TO_IN, tw: mm.tw * MM_TO_IN,
    bfTop: mm.bfTop * MM_TO_IN, tfTop: mm.tfTop * MM_TO_IN,
    bfBot: mm.bfBot * MM_TO_IN, tfBot: mm.tfBot * MM_TO_IN,
  }), [mm]);

  const propsIn = useMemo(() => manualHUnequalProps(dimsIn), [dimsIn]);

  const valid = mm.d > mm.tfTop + mm.tfBot && mm.bfTop > mm.tw && mm.bfBot > mm.tw
    && mm.d > 0 && mm.bfTop > 0 && mm.bfBot > 0 && mm.tw > 0 && mm.tfTop > 0 && mm.tfBot > 0;

  const svgUs = valid ? drawUnequalHSVG(dimsIn, '"') : null;
  const svgMm = valid ? drawUnequalHSVG(mm, 'mm') : null;
  const aMm = propsIn.A * IN2_TO_MM2, wMm = propsIn.W * LBFT_TO_KGM;

  return (
    <>
      <div className="detail-head"><div><h1 className="mono">Unequal Flange Built-up H-Section</h1></div></div>

      <BHDimCards fields={FIELDS} mm={mm} onChangeMm={set} />

      <div className="panel">
        {!valid && <p className="note" style={{ borderTop: 'none' }}>치수가 유효하지 않습니다 (d &gt; tf-top+tf-bot, bf &gt; tw 필요).</p>}
        <p className="note" style={valid ? { borderTop: 'none' } : undefined}>상하부 플랜지의 폭·두께를 독립적으로 입력할 수 있습니다.</p>
      </div>

      {svgUs && svgMm && (
        <div className="draw-grid">
          <figure className="panel draw">
            <figcaption className="draw-cap">Imperial<span>inch</span></figcaption>
            <div dangerouslySetInnerHTML={{ __html: svgUs }} />
            <div className="weight">
              <span className="wv mono">{propsIn.W.toFixed(1)}</span><span className="wu">lb/ft</span>
              <span className="wv mono" style={{ marginLeft: 14 }}>{propsIn.A.toFixed(2)}</span><span className="wu">in²</span>
            </div>
          </figure>
          <figure className="panel draw">
            <figcaption className="draw-cap">Metric<span>mm</span></figcaption>
            <div dangerouslySetInnerHTML={{ __html: svgMm }} />
            <div className="weight">
              <span className="wv mono">{wMm.toFixed(1)}</span><span className="wu">kg/m</span>
              <span className="wv mono" style={{ marginLeft: 14 }}>{aMm.toFixed(0)}</span><span className="wu">mm²</span>
            </div>
          </figure>
        </div>
      )}

      {svgUs && svgMm && (
        <div className="panel">
          <div className="panel-head"><h2>단면성능 (계산값)</h2></div>
          <table className="props">
            <thead><tr><th>Symbol</th><th className="r">Imperial</th><th className="r">Metric</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td className="sym mono">A</td><td className="r mono">{propsIn.A.toFixed(2)} <em>in²</em></td><td className="r mono">{aMm.toFixed(0)} <em>mm²</em></td><td className="desc">단면적</td></tr>
              <tr><td className="sym mono">Ix</td><td className="r mono">{propsIn.Ix.toFixed(1)} <em>in⁴</em></td><td className="r mono">{(propsIn.Ix * IN4_TO_MM4 / 1e6).toFixed(1)} <em>×10⁶ mm⁴</em></td><td className="desc">x축 관성모멘트 (도심 기준)</td></tr>
              <tr><td className="sym mono">Iy</td><td className="r mono">{propsIn.Iy.toFixed(1)} <em>in⁴</em></td><td className="r mono">{(propsIn.Iy * IN4_TO_MM4 / 1e6).toFixed(1)} <em>×10⁶ mm⁴</em></td><td className="desc">y축 관성모멘트</td></tr>
              <tr><td className="sym mono">ȳ</td><td className="r mono">{propsIn.ybar.toFixed(2)} <em>in</em></td><td className="r mono">{fmtDim(mm.d * (propsIn.ybar / dimsIn.d), 'mm')} <em>mm</em></td><td className="desc">도심 위치 (하단 기준)</td></tr>
              <tr><td className="sym mono">W</td><td className="r mono">{propsIn.W.toFixed(1)} <em>lb/ft</em></td><td className="r mono">{wMm.toFixed(1)} <em>kg/m</em></td><td className="desc">단위중량</td></tr>
            </tbody>
          </table>
          <p className="note">⚠ 계산값입니다 (필렛·용접부 미고려). A572 GR50/A36 표기는 두께에 따른 일반적 유통 규격 안내이며, 실제 조달 가능 여부는 제작사에 확인하시기 바랍니다.</p>
        </div>
      )}
    </>
  );
}
