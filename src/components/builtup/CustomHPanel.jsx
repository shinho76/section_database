import { useMemo, useState } from 'react';
import { manualHProps, IN2_TO_MM2, IN4_TO_MM4, LBFT_TO_KGM } from './compose.js';
import { ksLabel, usLabel } from './labels.js';
import { drawShapeSVG } from '../../lib/sectionSvg.js';
import DualUnitInput from './DualUnitInput.jsx';
import ThicknessCombo from './ThicknessCombo.jsx';

const MM_TO_IN = 1 / 25.4;

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

      <div className="bh-grid">
        <div className="panel">
          <div className="panel-head"><h2>치수 입력 (in ↔ mm 동시 입력)</h2></div>
          <div className="field-row">
            <DualUnitInput label="d (웹 높이)" mm={mm.d} onChangeMm={set('d')} />
            <DualUnitInput label="bf (플랜지 폭)" mm={mm.bf} onChangeMm={set('bf')} />
          </div>
          <div className="field-row">
            <label>tw (웹 두께)<ThicknessCombo value={mm.tw} onChange={set('tw')} /></label>
            <label>tf (플랜지 두께)<ThicknessCombo value={mm.tf} onChange={set('tf')} /></label>
          </div>
          {!valid && <p className="note">치수가 유효하지 않습니다 (d &gt; 2×tf, bf &gt; tw 필요).</p>}
        </div>
        {shape && (
          <div className="panel">
            <div className="panel-head"><h2>호칭</h2></div>
            <div className="alias" style={{ padding: '14px 18px' }}>
              <span className="chip chip-ks">KS &nbsp;<b className="mono">{ksLabel(mm)}</b></span>
              <span className="chip">US &nbsp;<b className="mono">{usLabel(propsIn)}</b></span>
            </div>
          </div>
        )}
      </div>

      {shape && (
        <>
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
              <div className="weight">
                <span className="wv mono">{shape.mt.W}</span><span className="wu">kg/m</span>
                <span className="wv mono" style={{ marginLeft: 14 }}>{shape.mt.A}</span><span className="wu">mm²</span>
              </div>
            </figure>
          </div>

          <div className="panel">
            <div className="panel-head"><h2>단면성능 (계산값)</h2></div>
            <table className="props">
              <thead><tr><th>Symbol</th><th className="r">Imperial</th><th className="r">Metric</th><th>Description</th></tr></thead>
              <tbody>
                <tr><td className="sym mono">A</td><td className="r mono">{shape.us.A} <em>in²</em></td><td className="r mono">{shape.mt.A} <em>mm²</em></td><td className="desc">단면적</td></tr>
                <tr><td className="sym mono">Ix</td><td className="r mono">{propsIn.Ix.toFixed(1)} <em>in⁴</em></td><td className="r mono">{(propsIn.Ix * IN4_TO_MM4 / 1e6).toFixed(1)} <em>×10⁶ mm⁴</em></td><td className="desc">x축 관성모멘트</td></tr>
                <tr><td className="sym mono">Iy</td><td className="r mono">{propsIn.Iy.toFixed(1)} <em>in⁴</em></td><td className="r mono">{(propsIn.Iy * IN4_TO_MM4 / 1e6).toFixed(1)} <em>×10⁶ mm⁴</em></td><td className="desc">y축 관성모멘트</td></tr>
                <tr><td className="sym mono">W</td><td className="r mono">{shape.us.W} <em>lb/ft</em></td><td className="r mono">{shape.mt.W} <em>kg/m</em></td><td className="desc">단위중량</td></tr>
              </tbody>
            </table>
            <p className="note">⚠ 계산값입니다 (필렛·용접부 미고려).</p>
          </div>
        </>
      )}
    </>
  );
}
