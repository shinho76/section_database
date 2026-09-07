import { useEffect, useState } from 'react';
import { useStore, TYPE_LABEL } from '../store.js';
import { loadType } from '../lib/dataLoader.js';
import { hasMatchPair, matchTargetType, findNearestInRows, widthHeightSimilarity } from '../lib/nearestMatch.js';
import { nucorAvailability, AVAIL_LABEL, AVAIL_MARK } from '../lib/nucorAvailability.js';
import { dongkukAvailable, DONGKUK_LABEL } from '../lib/dongkukAvailability.js';
import ShapeCompareModal from './ShapeCompareModal.jsx';

const seriesKey = (name) => name.split(/[X×]/)[0];
const DONGKUK_FILTER_TYPES = new Set(['KSH', 'KSL', 'KSC']);

export default function ShapeList() {
  const { activeKey, selectShape, setActiveKey, addToBom } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState(new Map()); // name -> { type, shape }
  const [compare, setCompare] = useState(null); // { row, match } while the compare modal is open
  // Nucor-Yamato availability filter: checked = shown. All off by default,
  // so W-shapes with any availability caveat are hidden until the user
  // opts back in to that tier.
  const [availFilter, setAvailFilter] = useState({ longlead: false, impact: false, unlisted: false });
  // Dongkuk-catalog exclusion filter for KSH/KSL/KSC (the only KS types with
  // a `dongkuk.available` flag - see dongkukAvailability.js). Unlike the W
  // filter above, this defaults to OFF (show everything, current behavior)
  // since the ask here is "let me opt IN to hiding" rather than "hidden
  // until I opt back in".
  const [excludeUnproduced, setExcludeUnproduced] = useState(false);
  const [sort, setSort] = useState(null); // { key, dir: 1|-1 }

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
  const hasDongkukFilter = DONGKUK_FILTER_TYPES.has(activeKey);
  const filteredRows = activeKey === 'W'
    ? rows.filter((s) => {
        const avail = nucorAvailability(activeKey, s.name);
        return !avail || availFilter[avail];
      })
    : hasDongkukFilter && excludeUnproduced
      ? rows.filter((s) => dongkukAvailable(s) !== false)
      : rows;
  const SORT_VAL = {
    W: (s) => parseFloat(s.mt.W),
    A: (s) => parseFloat(s.mt.A),
    d: (s) => parseFloat(s.us.d || s.us.Ht || s.us.OD),
  };
  const visibleRows = sort
    ? [...filteredRows].sort((a, b) => (SORT_VAL[sort.key](a) - SORT_VAL[sort.key](b)) * sort.dir)
    : filteredRows;
  const toggleSort = (key) => setSort((cur) => (cur?.key === key ? (cur.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }));
  const sortArrow = (key) => (sort?.key === key ? (sort.dir === 1 ? ' ▲' : ' ▼') : '');
  // series-band coloring only makes visual sense grouped by series - once
  // sorted by a performance column, fall back to plain rows.
  let lastSeries = null;
  let band = 0;

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>{TYPE_LABEL[activeKey]}</h2>
        <span className="tag">{visibleRows.length} shapes</span>
      </div>
      {activeKey === 'W' && (
        <div className="avail-legend">
          <span className="avail-legend-prefix">Material Availability: </span>
          {[
            ['longlead', 'Long lead'],
            ['impact', 'Impact estimated'],
            ['unlisted', 'Not in Product List'],
          ].map(([key, text]) => (
            <label key={key} className="avail-filter" title={AVAIL_LABEL[key]}>
              <input
                type="checkbox"
                checked={availFilter[key]}
                onChange={(e) => setAvailFilter((f) => ({ ...f, [key]: e.target.checked }))}
              />
              <em className={`avail-badge avail-${key}`}>{AVAIL_MARK[key]}</em> {text}
            </label>
          ))}
        </div>
      )}
      {hasDongkukFilter && (
        <div className="avail-legend">
          <label className="avail-filter" title={DONGKUK_LABEL[false]}>
            <input
              type="checkbox"
              checked={excludeUnproduced}
              onChange={(e) => setExcludeUnproduced(e.target.checked)}
            />
            자재 수급여부 확인 품목 제외
          </label>
        </div>
      )}
      {isKs && visibleRows.some((s) => dongkukAvailable(s) === false) && (
        <p className="note" style={{ borderTop: 'none' }}>* 생산여부 확인 필요</p>
      )}
      <table className="list">
        <thead>
          <tr>
            {isKs ? <><th>KS designation</th><th>공칭</th></> : <><th>AISC label</th><th>KS designation</th></>}
            {showMatch && <th>{isKs ? '유사 AISC 단면' : '유사 KS 단면'}</th>}
            <th className="r sortable" onClick={() => toggleSort('W')}>W (lb/ft)</th>
            <th className="r sortable" onClick={() => toggleSort('W')}>W (kg/m){sortArrow('W')}</th>
            <th className="r sortable" onClick={() => toggleSort('A')}>A (in²)</th>
            <th className="r sortable" onClick={() => toggleSort('A')}>A (cm²){sortArrow('A')}</th>
            <th className="r sortable" onClick={() => toggleSort('d')}>d / OD{sortArrow('d')}</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((s, i) => {
            const sk = seriesKey(s.name);
            if (sk !== lastSeries) { band = 1 - band; lastSeries = sk; }
            const aMm2 = parseFloat(s.mt.A);
            const m = matches.get(s.name);
            const avail = nucorAvailability(activeKey, s.name);
            return (
              <tr key={`${s.name}-${i}`} onClick={() => selectShape(s)} className={`series-band-${band}`}>
                <td className="mono strong">
                  <button
                    type="button" className="bom-add-btn" title="물량 산정에 담기"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToBom({ name: s.name, ks: s.ks, type: activeKey, unitWeightKgM: parseFloat(s.mt.W) || 0 });
                    }}
                  >
                    +
                  </button>
                  {isKs ? (s.ks || s.name) : s.name}
                  {avail && (
                    <em className={`avail-badge avail-${avail}`} title={AVAIL_LABEL[avail]}>
                      {AVAIL_MARK[avail]}
                    </em>
                  )}
                  {isKs && dongkukAvailable(s) === false && (
                    <em className="dongkuk-badge is-no" title={DONGKUK_LABEL[false]}>*</em>
                  )}
                </td>
                <td className="mono ks">{isKs ? s.name : s.ks}</td>
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
