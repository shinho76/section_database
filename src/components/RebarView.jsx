import { useEffect, useState } from 'react';
import { drawBarSVG } from '../lib/sectionSvg.js';

export default function RebarView() {
  const [data, setData] = useState(null);
  const [sel, setSel] = useState(null);

  useEffect(() => {
    import('../data/rebar.json').then((m) => setData(m.default));
  }, []);

  if (!data) return <div className="empty">불러오는 중…</div>;

  if (sel) {
    const mm = (sel.diaIn * 25.4).toFixed(1);
    return (
      <>
        <div className="detail-head">
          <button className="back" onClick={() => setSel(null)}>← REBAR</button>
          <div>
            <h1 className="mono">{sel.size}</h1>
            <div className="alias">
              <span className="chip chip-ks">KS &nbsp;<b className="mono">{sel.size} (D{mm})</b></span>
              <span className="chip">Type &nbsp;<b className="mono">REBAR</b></span>
            </div>
          </div>
        </div>
        <div className="draw-grid">
          <figure className="panel draw">
            <figcaption className="draw-cap">Imperial<span>inch</span></figcaption>
            <div dangerouslySetInnerHTML={{ __html: drawBarSVG(sel.diaIn.toFixed(3), 'in') }} />
            <div className="weight">
              <span className="wv mono">{sel.weightLbFt}</span><span className="wu">lb/ft</span>
            </div>
          </figure>
          <figure className="panel draw">
            <figcaption className="draw-cap">Metric<span>mm</span></figcaption>
            <div dangerouslySetInnerHTML={{ __html: drawBarSVG(mm, 'mm') }} />
            <div className="weight">
              <span className="wv mono">{(sel.weightLbFt * 1.48816).toFixed(2)}</span><span className="wu">kg/m</span>
            </div>
          </figure>
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Dimensions and section properties</h2></div>
          <table className="props">
            <thead><tr><th>Symbol</th><th className="r">Imperial</th><th className="r">Metric</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td className="sym mono">D</td><td className="r mono">{sel.diaIn} <em>in</em></td><td className="r mono">{sel.diaMm} <em>mm</em></td><td className="desc">공칭직경</td></tr>
              <tr><td className="sym mono">A</td><td className="r mono">{sel.areaIn2} <em>in²</em></td><td className="r mono">{(sel.areaIn2 * 645.16).toFixed(0)} <em>mm²</em></td><td className="desc">공칭단면적</td></tr>
              <tr><td className="sym mono">W</td><td className="r mono">{sel.weightLbFt} <em>lb/ft</em></td><td className="r mono">{(sel.weightLbFt * 1.48816).toFixed(2)} <em>kg/m</em></td><td className="desc">단위중량</td></tr>
            </tbody>
          </table>
          <p className="note">{data.source} ({data.sourceUrl})</p>
        </div>
      </>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>REBAR — U.S. Standard Bar Sizes</h2>
        <span className="tag">{data.bars.length} sizes</span>
      </div>
      <table className="list">
        <thead>
          <tr><th>Bar Size</th><th>KS</th><th className="r">공칭직경 (in)</th><th className="r">단면적 (in²)</th><th className="r">단위중량 (lb/ft)</th></tr>
        </thead>
        <tbody>
          {data.bars.map((b) => (
            <tr key={b.size} onClick={() => setSel(b)}>
              <td className="mono strong">{b.size}</td>
              <td className="mono ks">{b.size} (D{(b.diaIn * 25.4).toFixed(1)})</td>
              <td className="r mono">{b.diaIn}</td>
              <td className="r mono">{b.areaIn2}</td>
              <td className="r mono">{b.weightLbFt}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">{data.note}</p>
    </div>
  );
}
