import { useEffect, useState } from 'react';
import { useStore, TYPE_LABEL } from '../store.js';
import { searchType } from '../lib/dataLoader.js';

const seriesKey = (name) => name.split(/[X×]/)[0];

export default function ShapeList() {
  const { activeKey, query, selectShape } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchType(activeKey, query).then((r) => {
      if (!cancelled) { setRows(r); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [activeKey, query]);

  if (loading) return <div className="empty">불러오는 중…</div>;

  if (!rows.length) {
    return <div className="empty">“{query}”와 일치하는 단면이 없습니다. W24X370, 711×348 같은 형태로 검색해보세요.</div>;
  }

  const isKs = activeKey.startsWith('KS');
  let lastSeries = null;
  let band = 0;

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>{TYPE_LABEL[activeKey]}</h2>
        <span className="tag">{rows.length} shapes</span>
      </div>
      <table className="list">
        <thead>
          <tr>
            <th>{isKs ? 'KS label' : 'AISC label'}</th><th>KS designation</th>
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
            return (
              <tr key={`${s.name}-${i}`} onClick={() => selectShape(s)} className={`series-band-${band}`}>
                <td className="mono strong">{s.name}</td>
                <td className="mono ks">{s.ks}</td>
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
    </div>
  );
}
