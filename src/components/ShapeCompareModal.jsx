import { displayType } from '../store.js';
import SectionSVG from './SectionSVG.jsx';

const UNITS = [
  { key: 'us', label: 'Imperial', tag: 'inch', weightUnit: 'lb/ft', areaUnit: 'in²' },
  { key: 'mt', label: 'Metric', tag: 'mm', weightUnit: 'kg/m', areaUnit: 'mm²' },
];

/** One shape's SVG + weight/area readout for a single unit system — reused
 * per (shape, unit) cell in the comparison grid below. */
function CompareCell({ shape, unit }) {
  const rec = shape[unit.key];
  return (
    <figure className="panel draw">
      <figcaption className="draw-cap">{unit.label}<span>{unit.tag}</span></figcaption>
      <SectionSVG shape={shape} unit={unit.key} />
      <div className="weight">
        <span className="wv mono">{rec.W}</span><span className="wu">{unit.weightUnit}</span>
        <span className="wv mono" style={{ marginLeft: 14 }}>{rec.A}</span><span className="wu">{unit.areaUnit}</span>
      </div>
    </figure>
  );
}

// Performance keys worth comparing when picking a substitute section -
// dimension similarity alone (what nearestMatch.js scores) doesn't tell you
// whether the candidate can actually carry the same load; d/bf being close
// while A or Zx are meaningfully short is exactly the case a "97% 유사"
// dimension-only match would hide.
const PERF_KEYS = [
  { key: 'A', label: 'A (단면적)' },
  { key: 'Ix', label: 'Ix' },
  { key: 'Sx', label: 'Sx' },
  { key: 'Zx', label: 'Zx' },
  { key: 'rx', label: 'rx' },
  { key: 'Iy', label: 'Iy' },
  { key: 'ry', label: 'ry' },
  { key: 'J', label: 'J' },
];

function PerfCompareTable({ a, b }) {
  const rows = PERF_KEYS
    .map(({ key, label }) => {
      const av = parseFloat(a.mt[key]);
      const bv = parseFloat(b.mt[key]);
      if (!Number.isFinite(av) || !Number.isFinite(bv) || av === 0) return null;
      const deltaPct = ((bv - av) / av) * 100;
      return { key, label, av, bv, deltaPct };
    })
    .filter(Boolean);
  if (!rows.length) return null;
  return (
    <div className="panel">
      <div className="panel-head"><h2>단면성능 비교 (Metric)</h2></div>
      <table className="props">
        <thead>
          <tr><th>항목</th><th className="r">{a.name}</th><th className="r">{b.name}</th><th className="r">차이</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="sym mono">{r.label}</td>
              <td className="r mono">{r.av.toLocaleString()}</td>
              <td className="r mono">{r.bv.toLocaleString()}</td>
              <td className={`r mono${r.deltaPct < 0 ? ' val-conv' : ''}`} style={r.deltaPct < -5 ? { color: 'var(--val-danger)' } : undefined}>
                {r.deltaPct > 0 ? '+' : ''}{r.deltaPct.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">
        치수 유사도({a.name} → {b.name})는 d/bf/tf 등 겉치수 기준이며, 단면성능(A/Ix/Zx 등)이 부족한 항목이
        있을 수 있습니다(위 표에서 음수%로 표시). 대체 검토 시 성능값을 반드시 함께 확인하십시오.
        KS H형강의 Zx는 원본 KS 표기(현재 탄성단면계수로 확인됨)를 그대로 사용 중이라, AISC의 소성단면계수
        Zx와 직접 비교하면 안 됩니다 — 참고용으로만 사용하십시오.
      </p>
    </div>
  );
}

/** Visual side-by-side comparison of two shapes (a row's own shape and its
 * nearest AISC↔KS match), opened from the "유사 AISC 단면"/"유사 KS 단면"
 * column. Grid is grouped by unit system, not by shape: shape A/B share a
 * row (their column), and Imperial/Metric share a row — so the two shapes'
 * Imperial drawings sit side by side above their two Metric drawings,
 * instead of each shape's own Imperial+Metric pair being stacked together.
 * `onGoto` navigates to shape `b` and closes the modal. */
export default function ShapeCompareModal({ a, b, onClose, onGoto }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>단면 비교</h2>
          <button className="modal-close" onClick={onClose} aria-label="닫기">×</button>
        </div>
        <div className="modal-body">
          <div className="compare-grid">
            <div className="modal-shape-label">
              <span className="mono strong">{a.name}</span>
              <span className="tag">{displayType(a.type)}</span>
            </div>
            <div className="modal-shape-label">
              <span className="mono strong">{b.name}</span>
              <span className="tag">{displayType(b.type)}</span>
            </div>

            <CompareCell shape={a} unit={UNITS[0]} />
            <CompareCell shape={b} unit={UNITS[0]} />
            <CompareCell shape={a} unit={UNITS[1]} />
            <CompareCell shape={b} unit={UNITS[1]} />
          </div>
          <PerfCompareTable a={a} b={b} />
        </div>
        <div className="modal-foot">
          <button className="back" onClick={onClose}>닫기</button>
          <button className="btn-primary" onClick={onGoto}>{b.name}(으)로 이동</button>
        </div>
      </div>
    </div>
  );
}
