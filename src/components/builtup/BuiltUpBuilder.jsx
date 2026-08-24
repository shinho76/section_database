import { useMemo, useState } from 'react';
import LayerRow from './LayerRow.jsx';
import { composeSection, IN_TO_MM, IN2_TO_MM2, IN4_TO_MM4, LBFT_TO_KGM } from './compose.js';

let nextId = 1;
const newLayer = () => ({ id: nextId++, kind: 'db', dbType: '', dbName: '', dims: {}, yOffset: 0, props: null, label: '' });

function previewSVG(layers, result) {
  if (!result) return '';
  const W = 320, H = 260, cx = W / 2;
  const totalH = result.yTop + result.yBot || 1;
  const k = 200 / totalH;
  const cy = 20 + result.yTop * k;
  const parts = layers.filter((l) => l.props).map((l) => {
    const bw = Math.max(4, (l.props.bf || l.props.d * 0.4) * k);
    const bh = Math.max(2, l.props.d * k);
    const y = cy - (l.yOffset - result.ybar) * k - bh / 2;
    return `<rect x="${cx - bw / 2}" y="${y}" width="${bw}" height="${bh}"
      fill="var(--steel-fill)" stroke="var(--steel-line)" stroke-width="1.5"/>`;
  }).join('');
  const axisY = cy;
  return `<svg viewBox="0 0 ${W} ${H}" class="section-svg">
    <line x1="20" y1="${axisY}" x2="${W - 20}" y2="${axisY}" stroke="var(--tx-muted)" stroke-dasharray="4 3"/>
    ${parts}
  </svg>`;
}

export default function BuiltUpBuilder() {
  const [layers, setLayers] = useState([newLayer()]);

  const result = useMemo(() => composeSection(layers), [layers]);

  const updateLayer = (id, updated) => setLayers((ls) => ls.map((l) => (l.id === id ? updated : l)));
  const removeLayer = (id) => setLayers((ls) => ls.filter((l) => l.id !== id));
  const addLayer = () => setLayers((ls) => [...ls, newLayer()]);

  const ksName = layers.filter((l) => l.props).map((l) => l.label).join(' + ') || '—';

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ layers }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bh-section.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="detail-head">
        <div>
          <h1 className="mono">BH — Built-up 조립단면 구성기</h1>
          <div className="alias">
            <span className="chip chip-ks">KS &nbsp;<b className="mono">BH {ksName}</b></span>
          </div>
        </div>
      </div>

      <div className="bh-grid">
        <div className="panel">
          <div className="panel-head"><h2>레이어 목록</h2></div>
          {layers.map((l, i) => (
            <LayerRow
              key={l.id}
              layer={l}
              index={i}
              onChange={(updated) => updateLayer(l.id, updated)}
              onRemove={() => removeLayer(l.id)}
            />
          ))}
          <div style={{ padding: '10px 14px' }}>
            <button className="btn btn-add" onClick={addLayer}>+ 부재 추가</button>
          </div>
        </div>

        <figure className="panel draw">
          <figcaption className="draw-cap">미리보기<span>단면 개략도</span></figcaption>
          <div className="bh-preview" dangerouslySetInnerHTML={{ __html: previewSVG(layers, result) }} />
        </figure>
      </div>

      {result && (
        <div className="panel">
          <div className="panel-head">
            <h2>합성 단면성능 (계산값)</h2>
            <button className="btn" onClick={exportJSON}>JSON 내보내기</button>
          </div>
          <table className="props">
            <thead><tr><th>Symbol</th><th className="r">Imperial</th><th className="r">Metric</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td className="sym mono">A</td><td className="r mono">{result.A.toFixed(2)} <em>in²</em></td><td className="r mono">{(result.A * IN2_TO_MM2).toFixed(0)} <em>mm²</em></td><td className="desc">단면적</td></tr>
              <tr><td className="sym mono">Ix</td><td className="r mono">{result.Ix.toFixed(1)} <em>in⁴</em></td><td className="r mono">{(result.Ix * IN4_TO_MM4 / 1e6).toFixed(1)} <em>×10⁶ mm⁴</em></td><td className="desc">x축 관성모멘트</td></tr>
              <tr><td className="sym mono">Iy</td><td className="r mono">{result.Iy.toFixed(1)} <em>in⁴</em></td><td className="r mono">{(result.Iy * IN4_TO_MM4 / 1e6).toFixed(1)} <em>×10⁶ mm⁴</em></td><td className="desc">y축 관성모멘트</td></tr>
              <tr><td className="sym mono">rx</td><td className="r mono">{result.rx.toFixed(2)} <em>in</em></td><td className="r mono">{(result.rx * IN_TO_MM).toFixed(0)} <em>mm</em></td><td className="desc">x축 회전반경</td></tr>
              <tr><td className="sym mono">ry</td><td className="r mono">{result.ry.toFixed(2)} <em>in</em></td><td className="r mono">{(result.ry * IN_TO_MM).toFixed(0)} <em>mm</em></td><td className="desc">y축 회전반경</td></tr>
              {result.Sx_top && <tr><td className="sym mono">Sx(top)</td><td className="r mono">{result.Sx_top.toFixed(1)} <em>in³</em></td><td className="r mono">{(result.Sx_top * IN4_TO_MM4 / IN_TO_MM / 1e3).toFixed(1)} <em>×10³ mm³</em></td><td className="desc">상연 단면계수</td></tr>}
              {result.Sx_bot && <tr><td className="sym mono">Sx(bot)</td><td className="r mono">{result.Sx_bot.toFixed(1)} <em>in³</em></td><td className="r mono">{(result.Sx_bot * IN4_TO_MM4 / IN_TO_MM / 1e3).toFixed(1)} <em>×10³ mm³</em></td><td className="desc">하연 단면계수</td></tr>}
              <tr><td className="sym mono">W</td><td className="r mono">{result.W.toFixed(1)} <em>lb/ft</em></td><td className="r mono">{(result.W * LBFT_TO_KGM).toFixed(1)} <em>kg/m</em></td><td className="desc">단위중량</td></tr>
            </tbody>
          </table>
          <p className="note">
            ⚠ BH는 계산값입니다 (필렛·용접부 미고려). DB 레이어는 AISC 표값(A, Ix, Iy)을 그대로,
            수동 H 레이어는 근사식으로 계산합니다. J(비틀림상수)는 추후 개방형 얇은판 근사로 추가 예정입니다.
          </p>
        </div>
      )}
    </>
  );
}
