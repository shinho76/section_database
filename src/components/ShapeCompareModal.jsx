import { displayType } from '../store.js';
import SectionSVG from './SectionSVG.jsx';

/** One shape's Imperial+Metric SVG pair — identical layout to ShapeDetail's
 * main draw-grid (same SectionSVG + .weight bar), just reused per shape so
 * the comparison modal looks like two stacked "main windows". */
function ShapeDrawGrid({ shape }) {
  return (
    <div className="draw-grid">
      <figure className="panel draw">
        <figcaption className="draw-cap">Imperial<span>inch</span></figcaption>
        <SectionSVG shape={shape} unit="us" />
        <div className="weight">
          <span className="wv mono">{shape.us.W}</span><span className="wu">lb/ft</span>
          <span className="wv mono" style={{ marginLeft: 14 }}>{shape.us.A}</span><span className="wu">in²</span>
        </div>
      </figure>
      <figure className="panel draw">
        <figcaption className="draw-cap">Metric<span>mm</span></figcaption>
        <SectionSVG shape={shape} unit="mt" />
        <div className="weight">
          <span className="wv mono">{shape.mt.W}</span><span className="wu">kg/m</span>
          <span className="wv mono" style={{ marginLeft: 14 }}>{shape.mt.A}</span><span className="wu">mm²</span>
        </div>
      </figure>
    </div>
  );
}

/** Visual side-by-side comparison of two shapes (a row's own shape and its
 * nearest AISC↔KS match), opened from the "유사 AISC 단면"/"유사 KS 단면"
 * column. `onGoto` navigates to shape `b` and closes the modal. */
export default function ShapeCompareModal({ a, b, onClose, onGoto }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>단면 비교</h2>
          <button className="modal-close" onClick={onClose} aria-label="닫기">×</button>
        </div>
        <div className="modal-body">
          <div className="modal-shape-label">
            <span className="mono strong">{a.name}</span>
            <span className="tag">{displayType(a.type)}</span>
          </div>
          <ShapeDrawGrid shape={a} />

          <div className="modal-shape-label" style={{ marginTop: 20 }}>
            <span className="mono strong">{b.name}</span>
            <span className="tag">{displayType(b.type)}</span>
          </div>
          <ShapeDrawGrid shape={b} />
        </div>
        <div className="modal-foot">
          <button className="back" onClick={onClose}>닫기</button>
          <button className="btn-primary" onClick={onGoto}>{b.name}(으)로 이동</button>
        </div>
      </div>
    </div>
  );
}
