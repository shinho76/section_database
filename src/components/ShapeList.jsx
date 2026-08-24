import { useEffect, useState } from 'react';
import { useStore, TYPE_LABEL } from '../store.js';
import { searchType } from '../lib/dataLoader.js';

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

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>{TYPE_LABEL[activeKey]}</h2>
        <span className="tag">{rows.length} shapes</span>
      </div>
      <table className="list">
        <thead>
          <tr>
            <th>AISC label</th><th>KS designation</th><th className="r">W</th>
            <th className="r">A</th><th className="r">d / OD</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.name} onClick={() => selectShape(s)}>
              <td className="mono strong">{s.name}</td>
              <td className="mono ks">{s.ks}</td>
              <td className="r mono">{s.us.W} <em>lb/ft</em></td>
              <td className="r mono">{s.us.A} <em>in²</em></td>
              <td className="r mono">{s.us.d || s.us.Ht || s.us.OD || '—'} <em>in</em></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
