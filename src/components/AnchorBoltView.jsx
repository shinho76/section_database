import data from '../data/anchorbolt.json';

const MM_PER_IN = 25.4;
const LBFT_PER_IN2 = 2.6729;
const KG_PER_LB = 0.453592, M_PER_FT = 0.3048;

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

      <div className="panel">
        <div className="panel-head">
          <h2>사용 가능한 직경 및 단위중량</h2>
          <span className="tag">{data.sizes.length} sizes</span>
        </div>
        <table className="list">
          <thead>
            <tr>
              <th>Diameter (in)</th><th className="r">Diameter (mm)</th>
              <th className="r">Grade 36</th><th className="r">Grade 55</th><th className="r">Grade 105</th>
              <th className="r">Unit Weight (lb/ft)</th><th className="r">Unit Weight (kg/m)</th>
            </tr>
          </thead>
          <tbody>
            {data.sizes.map((s) => {
              const lbft = LBFT_PER_IN2 * s.diaIn * s.diaIn;
              const kgm = lbft * KG_PER_LB / M_PER_FT;
              const has105 = s.diaIn <= 3;
              return (
                <tr key={s.label}>
                  <td className="mono strong">{s.label}</td>
                  <td className="r mono val-conv">{(s.diaIn * MM_PER_IN).toFixed(1)}</td>
                  <td className="r mono">✓</td>
                  <td className="r mono">✓</td>
                  <td className={`r mono${has105 ? '' : ' not-available'}`}>{has105 ? '✓' : '—'}</td>
                  <td className="r mono">{lbft.toFixed(3)}</td>
                  <td className="r mono val-conv">{kgm.toFixed(3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="note">{data.sizesNote}</p>
      </div>
    </>
  );
}
