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
        </div>
        <div className="modal-foot">
          <button className="back" onClick={onClose}>닫기</button>
          <button className="btn-primary" onClick={onGoto}>{b.name}(으)로 이동</button>
        </div>
      </div>
    </div>
  );
}
