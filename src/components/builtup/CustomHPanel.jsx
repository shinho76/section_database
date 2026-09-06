import { useMemo, useState } from 'react';
import { manualHProps, IN2_TO_MM2, IN3_TO_MM3, IN4_TO_MM4, IN6_TO_MM6, IN_TO_MM, LBFT_TO_KGM } from './compose.js';
import { ksLabel, usLabel } from './labels.js';
import { drawShapeSVG } from '../../lib/sectionSvg.js';
import { BHDimCards } from './BHDimTable.jsx';
import BuiltupExtras from './BuiltupExtras.jsx';

const MM_TO_IN = 1 / 25.4;

const FIELDS = [
  { key: 'd', label: 'D (높이)' },
  { key: 'bf', label: 'Bf (폭)' },
  { key: 'tw', label: 'Tw (두께)', thickness: true },
  { key: 'tf', label: 'Tf (두께)', thickness: true },
];

export default function CustomHPanel() {
  const [mm, setMm] = useState({ d: 400, bf: 200, tw: 7.9375, tf: 12.7 });
  const set = (field) => (v) => setMm((m) => ({ ...m, [field]: v }));

  const propsIn = useMemo(() => manualHProps({
    d: mm.d * MM_TO_IN, bf: mm.bf * MM_TO_IN, tw: mm.tw * MM_TO_IN, tf: mm.tf * MM_TO_IN,
  }), [mm]);

  const valid = mm.d > 2 * mm.tf && mm.bf > mm.tw && mm.d > 0 && mm.bf > 0 && mm.tw > 0 && mm.tf > 0;

  const shape = useMemo(() => {
    if (!valid) return null;
    return {
      name: 'Custom H',
      type: 'W',
      us: {
        d: propsIn.d.toFixed(1), bf: propsIn.bf.toFixed(1), tw: propsIn.tw.toFixed(1), tf: propsIn.tf.toFixed(1),
        A: propsIn.A.toFixed(2), W: propsIn.W.toFixed(1),
      },
      mt: {
        d: mm.d.toFixed(0), bf: mm.bf.toFixed(0), tw: mm.tw.toFixed(0), tf: mm.tf.toFixed(0),
        A: (propsIn.A * IN2_TO_MM2).toFixed(0), W: (propsIn.W * LBFT_TO_KGM).toFixed(1),
      },
    };
  }, [propsIn, mm, valid]);

  return (
    <>
      <div className="detail-head"><div><h1 className="mono">Built-up H-Section</h1></div></div>

      <BHDimCards fields={FIELDS} mm={mm} onChangeMm={set} />

      {(!valid || shape) && (
        <div className="panel">
          {!valid && <p className="note" style={{ borderTop: 'none' }}>치수가 유효하지 않습니다 (d &gt; 2×tf, bf &gt; tw 필요).</p>}
          {shape && (
            <div className="alias" style={{ padding: '14px 18px' }}>
              <span className="chip chip-ks">KS &nbsp;<b className="mono">{ksLabel(mm)}</b></span>
              <span className="chip">US &nbsp;<b className="mono">{usLabel(propsIn)}</b></span>
            </div>
          )}
        </div>
      )}

      {shape && (
        <div className="draw-grid">
          <figure className="panel draw">
            <figcaption className="draw-cap">Imperial<span>inch</span></figcaption>
            <div dangerouslySetInnerHTML={{ __html: drawShapeSVG(shape, 'us') }} />
            <div className="weight">
              <span className="wv mono">{shape.us.W}</span><span className="wu">lb/ft</span>
              <span className="wv mono" style={{ marginLeft: 14 }}>{shape.us.A}</span><span className="wu">in²</span>
            </div>
          </figure>
          <figure className="panel draw">
            <figcaption className="draw-cap">Metric<span>mm</span></figcaption>
            <div dangerouslySetInnerHTML={{ __html: drawShapeSVG(shape, 'mt') }} />
            <div className="weight val-conv">
              <span className="wv mono">{shape.mt.W}</span><span className="wu">kg/m</span>
              <span className="wv mono" style={{ marginLeft: 14 }}>{shape.mt.A}</span><span className="wu">mm²</span>
            </div>
          </figure>
        </div>
      )}

      {shape && (
        <div className="panel">
          <div className="panel-head"><h2>단면성능 (계산값)</h2></div>
          <table className="props">
            <thead><tr><th>Symbol</th><th className="r">Imperial</th><th className="r">Metric</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td className="sym mono">A</td><td className="r mono">{shape.us.A} <em>in²</em></td><td className="r mono val-conv">{shape.mt.A} <em>mm²</em></td><td className="desc">단면적</td></tr>
              <tr><td className="sym mono">Ix</td><td className="r mono">{propsIn.Ix.toFixed(1)} <em>in⁴</em></td><td className="r mono val-conv">{(propsIn.Ix * IN4_TO_MM4 / 1e6).toFixed(1)} <em>×10⁶ mm⁴</em></td><td className="desc">x축 관성모멘트</td></tr>
              <tr><td className="sym mono">Iy</td><td className="r mono">{propsIn.Iy.toFixed(1)} <em>in⁴</em></td><td className="r mono val-conv">{(propsIn.Iy * IN4_TO_MM4 / 1e6).toFixed(1)} <em>×10⁶ mm⁴</em></td><td className="desc">y축 관성모멘트</td></tr>
              <tr><td className="sym mono">Zx</td><td className="r mono">{propsIn.Zx.toFixed(2)} <em>in³</em></td><td className="r mono val-conv">{(propsIn.Zx * IN3_TO_MM3 / 1e3).toFixed(1)} <em>×10³ mm³</em></td><td className="desc">x축 소성단면계수</td></tr>
              <tr><td className="sym mono">Zy</td><td className="r mono">{propsIn.Zy.toFixed(2)} <em>in³</em></td><td className="r mono val-conv">{(propsIn.Zy * IN3_TO_MM3 / 1e3).toFixed(1)} <em>×10³ mm³</em></td><td className="desc">y축 소성단면계수</td></tr>
              <tr><td className="sym mono">J</td><td className="r mono">{propsIn.J.toFixed(3)} <em>in⁴</em></td><td className="r mono val-conv">{(propsIn.J * IN4_TO_MM4 / 1e3).toFixed(1)} <em>×10³ mm⁴</em></td><td className="desc">비틀림상수 (근사, 필릿 무시)</td></tr>
              <tr><td className="sym mono">Cw</td><td className="r mono">{propsIn.Cw.toFixed(2)} <em>in⁶</em></td><td className="r mono val-conv">{(propsIn.Cw * IN6_TO_MM6 / 1e9).toFixed(2)} <em>×10⁹ mm⁶</em></td><td className="desc">뒤틀림상수 (근사)</td></tr>
              <tr><td className="sym mono">ho</td><td className="r mono">{propsIn.ho.toFixed(2)} <em>in</em></td><td className="r mono val-conv">{(propsIn.ho * IN_TO_MM).toFixed(0)} <em>mm</em></td><td className="desc">플랜지 도심간 거리</td></tr>
              <tr><td className="sym mono">rts</td><td className="r mono">{propsIn.rts?.toFixed(3) ?? '—'} <em>in</em></td><td className="r mono val-conv">{propsIn.rts != null ? (propsIn.rts * IN_TO_MM).toFixed(1) : '—'} <em>mm</em></td><td className="desc">횡좌굴 유효 회전반경 (근사)</td></tr>
              <tr><td className="sym mono">W</td><td className="r mono">{shape.us.W} <em>lb/ft</em></td><td className="r mono val-conv">{shape.mt.W} <em>kg/m</em></td><td className="desc">단위중량</td></tr>
            </tbody>
          </table>
          <p className="note">⚠ 계산값입니다 (필렛 미고려). Zx/Zy/J/Cw/rts는 사각 모서리(필렛 없음) 가정의 근사 계산이며 실제 설계 검토를 대체하지 않습니다. A572 GR50/A36 표기는 두께에 따른 일반적 유통 규격 안내이며, 실제 조달 가능 여부는 제작사에 확인하시기 바랍니다.</p>
        </div>
      )}

      {shape && (
        <BuiltupExtras
          plates={[
            { name: '상부 플랜지', widthMm: mm.bf, thicknessMm: mm.tf },
            { name: '웨브', widthMm: mm.d - 2 * mm.tf, thicknessMm: mm.tw },
            { name: '하부 플랜지', widthMm: mm.bf, thicknessMm: mm.tf },
          ]}
          weldLines={4}
          bomItem={{ name: 'Custom H ' + ksLabel(mm), ks: ksLabel(mm), type: 'BH-1', unitWeightKgM: parseFloat(shape.mt.W) }}
        />
      )}
    </>
  );
}
