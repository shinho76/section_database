import data from '../data/anchorbolt.json';

export default function AnchorBoltView() {
  return (
    <>
      <div className="detail-head"><div><h1 className="mono">Anchor Bolt — ASTM F1554</h1></div></div>

      <div className="panel">
        <div className="panel-head">
          <h2>앵커볼트 (기초-철골 접합용 앵커로드)</h2>
          <span className="tag">{data.grades.length} grades</span>
        </div>
        <table className="list">
          <thead>
            <tr>
              <th>Grade</th><th>식별 색상</th>
              <th className="r">항복강도 Fy (ksi)</th><th className="r">Fy (MPa)</th>
              <th className="r">인장강도 Fu (ksi)</th><th className="r">Fu (MPa)</th>
              <th>지름 범위</th><th>비고</th>
            </tr>
          </thead>
          <tbody>
            {data.grades.map((g) => (
              <tr key={g.grade}>
                <td className="mono strong">{g.grade}</td>
                <td>{g.color}</td>
                <td className="r mono">{g.fyKsi}</td>
                <td className="r mono val-conv">{g.fyMpa}</td>
                <td className="r mono">{g.fuMinKsi}–{g.fuMaxKsi}</td>
                <td className="r mono val-conv">{g.fuMinMpa}–{g.fuMaxMpa}</td>
                <td className="mono">{g.diaRange}</td>
                <td>{g.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="note">{data.source}</p>
        <p className="note">{data.note}</p>
      </div>
    </>
  );
}
