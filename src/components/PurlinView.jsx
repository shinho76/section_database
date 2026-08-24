import { useEffect, useState } from 'react';

export default function PurlinView({ variant }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    import('../data/purlin.json').then((m) => setData(m.default));
  }, []);

  if (!data) return <div className="empty">불러오는 중…</div>;

  const label = variant === 'PURLIN-ZEE' ? 'Purlin-ZEE (Z형강)' : 'Purlin-CEE (C형강)';

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>{label}</h2>
        <span className="tag">{data.shapes.length} sizes</span>
      </div>
      <div className="empty">
        치수표 미확정 — 원본 PDF({data.sourceUrl})가 이미지/바이너리 위주라 자동 추출이 되지 않았습니다.
        <br />1단계 구현 시 PDF를 직접 열어 옮겨 적어야 합니다.
      </div>
      <p className="note">{data.note}</p>
    </div>
  );
}
