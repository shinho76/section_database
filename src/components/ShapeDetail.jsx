import { useEffect, useState } from 'react';
import { useStore, displayType, KS_STANDARD } from '../store.js';
import { loadDefs, loadType } from '../lib/dataLoader.js';
import { supplyCheckAvailable, supplyCheckLabel, supplyCheckProducerName } from '../lib/materialAvailability.js';
import { hasMatchPair, matchTargetType, findNearestInRows, widthHeightSimilarity } from '../lib/nearestMatch.js';
import SectionSVG from './SectionSVG.jsx';
import PropsTable from './PropsTable.jsx';
import ShapeCompareModal from './ShapeCompareModal.jsx';

export default function ShapeDetail({ shape }) {
  const { activeKey, selectShape, setActiveKey, addToBom } = useStore();
  const [defs, setDefs] = useState(null);
  // Nearest AISC<->KS cross-reference for this one shape - same lookup
  // ShapeList uses per row, run here for just the shape being viewed so a
  // user who searched straight to a detail page (skipping the list) can
  // still see and jump to the closest equivalent in the other standard.
  const [match, setMatch] = useState(null); // { type, shape } | null
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => { loadDefs().then(setDefs); }, []);

  useEffect(() => {
    setMatch(null);
    setShowCompare(false);
    if (!hasMatchPair(activeKey)) return;
    let cancelled = false;
    (async () => {
      const targetType = matchTargetType(activeKey);
      const targetRows = await loadType(targetType);
      if (cancelled) return;
      const best = findNearestInRows(shape, activeKey, targetRows);
      if (best) setMatch({ type: targetType, shape: best });
    })();
    return () => { cancelled = true; };
  }, [shape, activeKey]);

  if (!defs) return <div className="empty">불러오는 중…</div>;

  const isKs = activeKey.startsWith('KS');
  const sim = match ? widthHeightSimilarity(shape, activeKey, match.shape) : null;

  return (
    <>
      <div className="detail-head">
        <button className="back" onClick={() => selectShape(null)}>← {displayType(activeKey)}</button>
        <div>
          <h1 className="mono">{shape.name}</h1>
          <div className="alias">
            <span className="chip chip-ks">KS &nbsp;<b className="mono">{shape.ks}</b></span>
            {shape.edi && <span className="chip">EDI 명칭 &nbsp;<b className="mono">{shape.edi}</b></span>}
            <span className="chip">Type &nbsp;<b className="mono">{displayType(shape.type)}</b></span>
            {KS_STANDARD[shape.type] && <span className="chip">{KS_STANDARD[shape.type]}</span>}
            {supplyCheckAvailable(shape) !== null && (
              <span
                className={`chip chip-dongkuk ${supplyCheckAvailable(shape) ? 'is-yes' : 'is-no'}`}
                title={supplyCheckLabel(shape)}
              >
                {supplyCheckAvailable(shape) ? `✓ ${supplyCheckProducerName(shape)} 생산` : '✕ 자재수급확인'}
              </span>
            )}
            <button
              type="button" className="chip chip-btn"
              onClick={() => addToBom({ name: shape.name, ks: shape.ks, type: activeKey, unitWeightKgM: parseFloat(shape.mt.W) || 0 })}
            >
              🧺 물량 산정에 담기
            </button>
            {match && (
              <button type="button" className="chip chip-btn" onClick={() => setShowCompare(true)}>
                ↔ 유사 {isKs ? 'AISC' : 'KS'} 단면 {match.shape.name}
                {sim != null && <span className="match-sim">{sim.toFixed(0)}%</span>}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="draw-grid">
        <figure className="panel draw">
          <figcaption className="draw-cap">Imperial<span>inch</span></figcaption>
          <SectionSVG shape={shape} unit="us" />
          <div className="weight">
            <span className="wv mono">{shape.us.W}</span><span className="wu">lb/ft</span>
          </div>
        </figure>
        <figure className="panel draw">
          <figcaption className="draw-cap">Metric<span>mm</span></figcaption>
          <SectionSVG shape={shape} unit="mt" />
          <div className="weight">
            <span className="wv mono">{shape.mt.W}</span><span className="wu">kg/m</span>
          </div>
        </figure>
      </div>

      <PropsTable shape={shape} defs={defs} />

      {showCompare && match && (
        <ShapeCompareModal
          a={shape}
          b={match.shape}
          onClose={() => setShowCompare(false)}
          onGoto={() => { setActiveKey(match.type); selectShape(match.shape); setShowCompare(false); }}
        />
      )}
    </>
  );
}
