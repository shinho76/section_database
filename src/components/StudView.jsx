import data from '../data/stud.json';

const MM_PER_IN = 25.4;
const KN_PER_KIPS = 4.44822;

export default function StudView() {
  return (
    <>
      <div className="detail-head"><div><h1 className="mono">Shear Stud — AWS D1.1</h1></div></div>

      <div className="panel">
        <div className="panel-head">
          <h2>헤드형 시어 스터드 (Headed Shear Stud Connector, Type B)</h2>
          <span className="tag">{data.rows.length} sizes</span>
        </div>
        <table className="list">
          <thead>
            <tr>
              <th>축경 (Shank Dia.)</th><th className="r">축경 (mm)</th>
              <th className="r">헤드 최소직경 (in)</th><th className="r">헤드 최소높이 (in)</th>
              <th className="r">축단면적 (in²)</th>
              <th className="r">인장내력 (kips)</th><th className="r">인장내력 (kN)</th>
              <th className="r">항복내력 (kips)</th><th className="r">항복내력 (kN)</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => {
              const area = (Math.PI / 4) * r.diaIn * r.diaIn;
              const tenKips = area * data.fuKsi, yldKips = area * data.fyKsi;
              return (
                <tr key={r.label}>
                  <td className="mono strong">{r.label}</td>
                  <td className="r mono val-conv">{(r.diaIn * MM_PER_IN).toFixed(1)}</td>
                  <td className="r mono">{(1.5 * r.diaIn).toFixed(3)}</td>
                  <td className="r mono">{(0.4 * r.diaIn).toFixed(3)}</td>
                  <td className="r mono">{area.toFixed(3)}</td>
                  <td className="r mono">{tenKips.toFixed(1)}</td>
                  <td className="r mono val-conv">{(tenKips * KN_PER_KIPS).toFixed(1)}</td>
                  <td className="r mono">{yldKips.toFixed(1)}</td>
                  <td className="r mono val-conv">{(yldKips * KN_PER_KIPS).toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="note">{data.source}</p>
        <p className="note">{data.note}</p>
      </div>
    </>
  );
}
