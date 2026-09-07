import { useState } from 'react';
import data from '../data/stud.json';
import { useStore } from '../store.js';
import { STEEL_DENSITY_LB_FT3 } from './builtup/compose.js';

const MM_PER_IN = 25.4;
const KN_PER_KIPS = 4.44822;
const LB_IN3 = STEEL_DENSITY_LB_FT3 / 1728; // lb/ft³ -> lb/in³
const KG_PER_LB = 0.453592;

/** One stud row's weight calculator + "add to BOM" - stud length (unlike
 * bolt/rebar/rod) isn't in the reference table (it's picked per connection,
 * not a catalog property), so the user enters it here. Weight = shank
 * volume only (area x length x density) - the head adds a little extra
 * material this doesn't account for, noted below rather than guessed at. */
function StudRow({ r, area, tenKips, yldKips }) {
  const [lenMm, setLenMm] = useState('');
  const addToBom = useStore((s) => s.addToBom);
  const lenIn = parseFloat(lenMm) / MM_PER_IN;
  const weightKg = Number.isFinite(lenIn) && lenIn > 0 ? area * lenIn * LB_IN3 * KG_PER_LB : null;
  return (
    <tr>
      <td className="mono strong">{r.label}</td>
      <td className="r mono val-conv">{(r.diaIn * MM_PER_IN).toFixed(1)}</td>
      <td className="r mono">{(1.5 * r.diaIn).toFixed(3)}</td>
      <td className="r mono">{(0.4 * r.diaIn).toFixed(3)}</td>
      <td className="r mono">{area.toFixed(3)}</td>
      <td className="r mono">{tenKips.toFixed(1)}</td>
      <td className="r mono val-conv">{(tenKips * KN_PER_KIPS).toFixed(1)}</td>
      <td className="r mono">{yldKips.toFixed(1)}</td>
      <td className="r mono val-conv">{(yldKips * KN_PER_KIPS).toFixed(1)}</td>
      <td className="r">
        <span className="unit-input">
          <input
            type="number" min={0} step={1} className="bom-input-sm" placeholder="길이"
            value={lenMm} onChange={(e) => setLenMm(e.target.value)}
          />
          <span className="unit-suffix">mm</span>
        </span>
      </td>
      <td>
        <button
          type="button" className="bom-add-btn" title="물량 산정에 담기 (전체 길이 입력 필요)"
          disabled={weightKg == null}
          onClick={() => addToBom({ name: `Stud ${r.label} L${lenMm}mm`, type: 'STUD', unitWeightKgM: weightKg, perEach: true })}
        >
          +
        </button>
      </td>
    </tr>
  );
}

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
              <th className="r">전체 길이</th><th />
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => {
              const area = (Math.PI / 4) * r.diaIn * r.diaIn;
              const tenKips = area * data.fuKsi, yldKips = area * data.fyKsi;
              return (
                <StudRow key={r.label} r={r} area={area} tenKips={tenKips} yldKips={yldKips} />
              );
            })}
          </tbody>
        </table>
        <p className="note">{data.source}</p>
        <p className="note">{data.note}</p>
        <p className="note">
          "물량 산정에 담기"의 중량은 전체 길이(용접 후 축소분 포함 여부는 시공 전 길이 기준) × 축단면적 ×
          강재 밀도로 계산한 축(shank) 근사치이며, 헤드(head) 부분의 추가 재료는 포함하지 않습니다.
        </p>
      </div>
    </>
  );
}
