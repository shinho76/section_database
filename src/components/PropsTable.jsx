import { useState } from 'react';
import { KS_STANDARD } from '../store.js';

// Shown by default; everything else (warping constants, perimeter figures,
// Design-Guide-9 statical moments, etc.) is real data but rarely needed, so
// it's tucked behind "더 보기" instead of forcing a 30-50 row scroll on
// every shape page.
const CORE_KEYS = new Set([
  'd', 'ddet', 'Ht', 'h', 'OD', 'ID', 'bf', 'bfdet', 'B', 'b',
  'tw', 'twdet', 'tf', 'tfdet', 't', 't2', 'tnom', 'tdes', 'r', 'kdes',
  'A', 'W', 'Ix', 'Iy', 'Sx', 'Sy', 'Zx', 'Zy', 'rx', 'ry',
  // Practical values connection/structural designers look up on every
  // shape page - previously stuck behind "더 보기" forcing an extra click
  // every time (k1/kdet/T/WGi/WGo for gauge/clearance, J/Cw/rts/ho for LTB).
  'k1', 'kdet', 'T', 'WGi', 'WGo', 'J', 'Cw', 'rts', 'ho',
]);

// Which keys, for which KS types, are this app's own geometric calculation
// (sharp-corner/no-fillet approximation from d/bf/tw/tf etc.) rather than a
// transcribed KS D 3502/3566/3568 appendix value - only H's Ix/Iy/rx/ry/Zx/Zy
// are a real published table (see tools/augment_ks_section_props.py). Drives
// the extra disclaimer note below so users don't mistake a computed value
// for an official one.
const GEOMETRIC_KEYS = {
  KSH: ['k1', 'kdet', 'T', 'J', 'Cw', 'rts', 'ho'],
  KSC: ['Ix', 'Iy', 'Sx', 'Sy', 'Zx', 'Zy', 'rx', 'ry', 'x'],
  KST: ['Ix', 'Iy', 'Sx', 'Zx', 'Zy', 'rx', 'ry', 'y', 'J'],
  KSP: ['Ix', 'Iy', 'Sx', 'Sy', 'Zx', 'Zy', 'rx', 'ry', 'J', 'C'],
  KSPP: ['Ix', 'Iy', 'Sx', 'Sy', 'Zx', 'Zy', 'rx', 'ry', 'J', 'C'],
  KSB: ['Ix', 'Iy', 'Sx', 'Sy', 'Zx', 'Zy', 'rx', 'ry', 'J'],
};

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

function PropRow({ k, shape, isKs, defs }) {
  const [ui, um] = UNITS[k] || ['', ''];
  return (
    <tr>
      <td className="sym mono">{k}</td>
      <td className={`r mono${isKs ? ' val-conv' : ''}`}>{shape.us[k] ?? '—'} <em>{ui}</em></td>
      <td className={`r mono${isKs ? '' : ' val-conv'}`}>{shape.mt[k] ?? '—'} <em>{um}</em></td>
      <td className="desc">{defs[k]}</td>
    </tr>
  );
}

export default function PropsTable({ shape, defs }) {
  const [expanded, setExpanded] = useState(false);
  const keys = Object.keys(defs).filter((k) => shape.us[k] !== undefined || shape.mt[k] !== undefined);
  const coreKeys = keys.filter((k) => CORE_KEYS.has(k));
  const moreKeys = keys.filter((k) => !CORE_KEYS.has(k));
  // Source files: KS shapes come from each type's own KS standard's SI-unit
  // text table (KS D 3502 for H/L/T/C, KS D 3568 for KSB, KS D 3566 for
  // KSP — see KS_STANDARD), so Metric is DB-native and Imperial is this
  // app's conversion. AISC shapes come from the AISC Shapes Database v16.0
  // Excel file in imperial units, so Imperial is DB-native and Metric is
  // the conversion - the reverse of KS.
  const isKs = shape.type.startsWith('KS');
  const ksStd = KS_STANDARD[shape.type] || 'KS';
  const geometricKeys = (GEOMETRIC_KEYS[shape.type] || []).filter((k) => keys.includes(k));

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
            <th className="r">Imperial</th>
            <th className="r">Metric</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {coreKeys.map((k) => <PropRow key={k} k={k} shape={shape} isKs={isKs} defs={defs} />)}
          {moreKeys.length > 0 && expanded && moreKeys.map((k) => <PropRow key={k} k={k} shape={shape} isKs={isKs} defs={defs} />)}
        </tbody>
      </table>
      {moreKeys.length > 0 && (
        <button type="button" className="props-more-btn" onClick={() => setExpanded((e) => !e)}>
          {expanded ? '접기 ▲' : `추가 항목 더 보기 (${moreKeys.length}) ▼`}
        </button>
      )}
      <p className="note">
        {isKs
          ? `Metric 값은 ${ksStd} 규격표(SI 단위 원본)의 값을 그대로 사용합니다. Imperial 값은 이 앱이 계산한 단위 환산값입니다.`
          : 'Imperial 값은 AISC Shapes Database v16.0 Excel 파일(imperial 단위 원본)의 값을 그대로 사용합니다. Metric 값은 이 앱이 계산한 단위 환산값입니다.'}
      </p>
      {geometricKeys.length > 0 && (
        <p className="note">
          {geometricKeys.join(', ')}는(은) {ksStd} 부록표가 아니라 d/bf/tw/tf 등 치수로부터 이 앱이
          기하학적으로 계산한 값입니다(필렛 반경 미반영 근사). 공식 발간표와 다를 수 있으니 최종 설계에는
          원문을 확인하십시오.
        </p>
      )}
    </div>
  );
}
