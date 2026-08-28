import { useEffect, useState } from 'react';
import { useStore, TYPE_LABEL } from '../store.js';
import { loadType } from '../lib/dataLoader.js';
import { hasMatchPair, matchTargetType, findNearestInRows, widthHeightSimilarity } from '../lib/nearestMatch.js';
import { nucorAvailability, AVAIL_LABEL, AVAIL_MARK } from '../lib/nucorAvailability.js';
import ShapeCompareModal from './ShapeCompareModal.jsx';

const seriesKey = (name) => name.split(/[X×]/)[0];

export default function ShapeList() {
  const { activeKey, selectShape, setActiveKey } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState(new Map()); // name -> { type, shape }
  const [compare, setCompare] = useState(null); // { row, match } while the compare modal is open

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMatches(new Map());
    loadType(activeKey).then((r) => {
      if (!cancelled) { setRows(r); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [activeKey]);

  useEffect(() => {
    if (!rows.length || !hasMatchPair(activeKey)) return;
    let cancelled = false;
    (async () => {
      const targetType = matchTargetType(activeKey);
      const targetRows = await loadType(targetType);
      if (cancelled) return;
      const next = new Map();
      for (const s of rows) {
        const best = findNearestInRows(s, activeKey, targetRows);
        if (best) next.set(s.name, { type: targetType, shape: best });
      }
      if (!cancelled) setMatches(next);
    })();
    return () => { cancelled = true; };
  }, [rows, activeKey]);

  const gotoMatch = (m) => {
    setActiveKey(m.type);
    selectShape(m.shape);
  };

  if (loading) return <div className="empty">불러오는 중…</div>;

  if (!rows.length) {
    return <div className="empty">데이터가 없습니다.</div>;
  }

  const isKs = activeKey.startsWith('KS');
  const showMatch = hasMatchPair(activeKey);
  let lastSeries = null;
  let band = 0;

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>{TYPE_LABEL[activeKey]}</h2>
        <span className="tag">{rows.length} shapes</span>
      </div>
      {activeKey === 'W' && (
        <div className="avail-legend">
          <span><em className="avail-badge avail-longlead">{AVAIL_MARK.longlead}</em> {AVAIL_LABEL.longlead}</span>
          <span><em className="avail-badge avail-impact">{AVAIL_MARK.impact}</em> {AVAIL_LABEL.impact}</span>
          <span><em className="avail-badge avail-unlisted">{AVAIL_MARK.unlisted}</em> {AVAIL_LABEL.unlisted}</span>
        </div>
      )}
      <table className="list">
        <thead>
          <tr>
            <th>{isKs ? 'KS label' : 'AISC label'}</th><th>KS designation</th>
            {showMatch && <th>{isKs ? '유사 AISC 단면' : '유사 KS 단면'}</th>}
            <th className="r">W (lb/ft)</th><th className="r">W (kg/m)</th>
            <th className="r">A (in²)</th><th className="r">A (cm²)</th>
            <th className="r">d / OD</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => {
            const sk = seriesKey(s.name);
            if (sk !== lastSeries) { band = 1 - band; lastSeries = sk; }
            const aMm2 = parseFloat(s.mt.A);
            const m = matches.get(s.name);
            const avail = nucorAvailability(activeKey, s.name);
            return (
              <tr key={`${s.name}-${i}`} onClick={() => selectShape(s)} className={`series-band-${band}`}>
                <td className="mono strong">
                  {s.name}
                  {avail && (
                    <em className={`avail-badge avail-${avail}`} title={AVAIL_LABEL[avail]}>
                      {AVAIL_MARK[avail]}
                    </em>
                  )}
                </td>
                <td className="mono ks">{s.ks}</td>
                {showMatch && (
                  <td className="mono ks">
                    {m ? (
                      <>
                        <button
                          className="match-link"
                          onClick={(e) => { e.stopPropagation(); setCompare({ row: s, match: m }); }}
                        >
                          {m.shape.name}
                        </button>
                        {(() => {
                          const sim = widthHeightSimilarity(s, activeKey, m.shape);
                          return sim == null ? null : <span className="match-sim">{sim.toFixed(0)}%</span>;
                        })()}
                      </>
                    ) : '—'}
                  </td>
                )}
                <td className="r mono">{s.us.W}</td>
                <td className="r mono">{s.mt.W}</td>
                <td className="r mono">{s.us.A}</td>
                <td className="r mono">{Number.isFinite(aMm2) ? (aMm2 / 100).toFixed(2) : '—'}</td>
                <td className="r mono">{s.us.d || s.us.Ht || s.us.OD || '—'} <em>in</em></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {compare && (
        <ShapeCompareModal
          a={compare.row}
          b={compare.match.shape}
          onClose={() => setCompare(null)}
          onGoto={() => { gotoMatch(compare.match); setCompare(null); }}
        />
      )}
    </div>
  );
}
