const UNITS = {
  W: ['lb/ft', 'kg/m'], A: ['in²', 'mm²'],
  d: ['in', 'mm'], ddet: ['in', 'mm'], Ht: ['in', 'mm'], h: ['in', 'mm'], OD: ['in', 'mm'],
  bf: ['in', 'mm'], bfdet: ['in', 'mm'], B: ['in', 'mm'], b: ['in', 'mm'], ID: ['in', 'mm'],
  tw: ['in', 'mm'], twdet: ['in', 'mm'], 'twdet/2': ['in', 'mm'], tf: ['in', 'mm'],
  tfdet: ['in', 'mm'], t: ['in', 'mm'], t2: ['in', 'mm'], r: ['in', 'mm'],
  tnom: ['in', 'mm'], tdes: ['in', 'mm'],
  kdes: ['in', 'mm'], kdet: ['in', 'mm'], k1: ['in', 'mm'],
  x: ['in', 'mm'], y: ['in', 'mm'], eo: ['in', 'mm'], xp: ['in', 'mm'], yp: ['in', 'mm'],
  Ix: ['in⁴', '×10⁶ mm⁴'], Iy: ['in⁴', '×10⁶ mm⁴'], Iz: ['in⁴', '×10⁶ mm⁴'],
  Zx: ['in³', '×10³ mm³'], Zy: ['in³', '×10³ mm³'], Sz: ['in³', '×10³ mm³'],
  Sx: ['in³', '×10³ mm³'], Sy: ['in³', '×10³ mm³'],
  rx: ['in', 'mm'], ry: ['in', 'mm'], rz: ['in', 'mm'], rts: ['in', 'mm'], ro: ['in', 'mm'],
  J: ['in⁴', '×10³ mm⁴'], Cw: ['in⁶', '×10⁹ mm⁶'], C: ['in³', '×10³ mm³'],
  Wno: ['in²', 'mm²'], Sw1: ['in⁴', '×10⁶ mm⁴'], Sw2: ['in⁴', '×10⁶ mm⁴'], Sw3: ['in⁴', '×10⁶ mm⁴'],
  Qf: ['in³', '×10³ mm³'], Qw: ['in³', '×10³ mm³'],
  Iw: ['in⁶', '×10⁹ mm⁶'],
  zA: ['in', 'mm'], zB: ['in', 'mm'], zC: ['in', 'mm'],
  wA: ['in', 'mm'], wB: ['in', 'mm'], wC: ['in', 'mm'],
  SwA: ['in³', '×10³ mm³'], SwB: ['in³', '×10³ mm³'], SwC: ['in³', '×10³ mm³'],
  SzA: ['in³', '×10³ mm³'], SzB: ['in³', '×10³ mm³'], SzC: ['in³', '×10³ mm³'],
  ho: ['in', 'mm'], PA: ['in', 'mm'], PA2: ['in', 'mm'], PB: ['in', 'mm'],
  PC: ['in', 'mm'], PD: ['in', 'mm'], T: ['in', 'mm'], WGi: ['in', 'mm'], WGo: ['in', 'mm'],
};

export default function PropsTable({ shape, defs }) {
  const keys = Object.keys(defs).filter((k) => shape.us[k] !== undefined || shape.mt[k] !== undefined);
  // AISC rows publish BOTH Imperial and Metric natively (SI table, not a
  // conversion); KS rows publish only Metric, so their Imperial column here
  // is unit-converted by this app - dim it to flag that difference.
  const isKs = shape.type.startsWith('KS');

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Dimensions and section properties</h2>
        <span className="tag">{keys.length} values</span>
      </div>
      <table className="props">
        <thead>
          <tr>
            <th>Symbol</th>
            <th className="r">Imperial{isKs && <span className="conv-flag">conv.</span>}</th>
            <th className="r">Metric</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => {
            const [ui, um] = UNITS[k] || ['', ''];
            return (
              <tr key={k}>
                <td className="sym mono">{k}</td>
                <td className={`r mono${isKs ? ' val-conv' : ''}`}>{shape.us[k] ?? '—'} <em>{ui}</em></td>
                <td className="r mono">{shape.mt[k] ?? '—'} <em>{um}</em></td>
                <td className="desc">{defs[k]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="note">
        {isKs
          ? 'Metric 값은 KS D 3502:2022 규격표의 값을 그대로 사용합니다. Imperial 값(흐리게 표시)은 이 앱이 계산한 단위 환산값입니다.'
          : <>Metric 값은 AISC Shapes Database v16.0의 SI 표에 있는 값을 그대로 사용합니다 (단위 환산이 아닌 원본 값).
              KS 호칭은 depth × width × t<sub>w</sub> × t<sub>f</sub> (mm) 형태로 파생됩니다.</>}
      </p>
    </div>
  );
}
