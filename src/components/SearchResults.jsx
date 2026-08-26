import { useEffect, useState } from 'react';
import { useStore, displayType } from '../store.js';
import { searchAll, resolveShape } from '../lib/dataLoader.js';

export default function SearchResults() {
  const { query, setActiveKey, selectShape, setQuery } = useStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchAll(query).then((r) => {
      if (!cancelled) { setRows(r); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [query]);

  const onPick = async (entry) => {
    const shape = await resolveShape(entry);
    if (!shape) return;
    setActiveKey(entry.type);
    selectShape(shape);
    setQuery('');
  };

  if (loading) return <div className="empty">검색 중…</div>;

  if (!rows.length) {
    return <div className="empty">“{query}”와 일치하는 단면이 없습니다. 전체 AISC · KS 단면을 대상으로 검색합니다.</div>;
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>검색 결과 — 전체 단면</h2>
        <span className="tag">{rows.length} shapes</span>
      </div>
      <table className="list">
        <thead>
          <tr><th>Label</th><th>KS designation</th><th className="r">Type</th></tr>
        </thead>
        <tbody>
          {rows.slice(0, 300).map((s, i) => (
            <tr key={`${s.type}-${s.name}-${i}`} onClick={() => onPick(s)}>
              <td className="mono strong">{s.name}</td>
              <td className="mono ks">{s.ks}</td>
              <td className="r mono">{displayType(s.type)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 300 && (
        <p className="note">{rows.length}개 중 300개만 표시됩니다. 검색어를 좁혀보세요.</p>
      )}
    </div>
  );
}
