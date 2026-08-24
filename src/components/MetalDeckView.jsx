import { useEffect, useState } from 'react';

export default function MetalDeckView() {
  const [data, setData] = useState(null);

  useEffect(() => {
    import('../data/metaldeck.json').then((m) => setData(m.default));
  }, []);

  if (!data) return <div className="empty">불러오는 중…</div>;

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>METAL DECK — Vulcraft Composite Deck</h2>
        <span className="tag">{data.profiles.length} profiles</span>
      </div>
      <table className="list">
        <thead>
          <tr><th>Profile</th><th className="r">Depth (in)</th><th className="r">Width (in)</th><th>게이지별 LRFD 하중표</th></tr>
        </thead>
        <tbody>
          {data.profiles.map((p) => (
            <tr key={p.name}>
              <td className="mono strong">{p.name}</td>
              <td className="r mono">{p.depthIn}</td>
              <td className="r mono">{p.widthIn}</td>
              <td className="desc">{p.gauges ? '—' : '미정 (원본 카탈로그 PDF 확인 필요)'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">{data.note}</p>
    </div>
  );
}
