import rows from '../data/plateAvailability.json';

/** Reference table: standard ASTM plate-thickness availability by grade,
 * plus each thickness's unit weight (psf / kg/m², steel density 490 pcf).
 * psf is the direct density×thickness calc; kg/m² is unit-converted from it
 * (marked accordingly, per the DB-vs-converted convention used app-wide). */
export default function AvailablePlateView() {
  return (
    <>
      <div className="detail-head"><div><h1 className="mono">Plate Stock Availability</h1></div></div>

      <div className="panel">
        <div className="panel-head">
          <h2>Plate Thickness · Grade Availability</h2>
          <span className="tag">{rows.length} sizes</span>
        </div>
        <table className="list">
          <thead>
            <tr>
              <th className="r">Thickness</th>
              <th>Grade</th>
              <th className="r">Unit Weight (psf)</th>
              <th className="r">Unit Weight (kg/m²)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.thickness}>
                <td className="r mono strong">{r.thickness}</td>
                <td className={`mono${r.grade ? '' : ' not-available'}`}>{r.grade || 'NOT AVAILABLE'}</td>
                <td className="r mono">{r.psf.toFixed(2)}</td>
                <td className="r mono val-conv">{r.kgm2.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="note">
          5″ 두께는 A36 자재만 가능하며, 그 외 표시된 모든 두께는 A36 및 A572 GR50 두 자재 모두 가능합니다
          (표에 없거나 NOT AVAILABLE로 표시된 두께는 표준 유통 재고가 아닙니다). 단위중량은 강재 밀도
          490 lb/ft³(7,850 kg/m³) 기준의 계산값이며, 실제 조달 가능 여부는 제작사에 확인하시기 바랍니다.
        </p>
      </div>
    </>
  );
}
