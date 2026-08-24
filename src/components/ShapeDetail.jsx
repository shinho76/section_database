import { useEffect, useState } from 'react';
import { useStore } from '../store.js';
import { loadDefs } from '../lib/dataLoader.js';
import SectionSVG from './SectionSVG.jsx';
import PropsTable from './PropsTable.jsx';

export default function ShapeDetail({ shape }) {
  const { activeKey, selectShape } = useStore();
  const [defs, setDefs] = useState(null);

  useEffect(() => { loadDefs().then(setDefs); }, []);

  if (!defs) return <div className="empty">불러오는 중…</div>;

  return (
    <>
      <div className="detail-head">
        <button className="back" onClick={() => selectShape(null)}>← {activeKey}</button>
        <div>
          <h1 className="mono">{shape.name}</h1>
          <div className="alias">
            <span className="chip chip-ks">KS &nbsp;<b className="mono">{shape.ks}</b></span>
            <span className="chip">EDI 명칭 &nbsp;<b className="mono">{shape.edi}</b></span>
            <span className="chip">Type &nbsp;<b className="mono">{shape.type}</b></span>
          </div>
        </div>
      </div>

      <div className="draw-grid">
        <figure className="panel draw">
          <figcaption className="draw-cap">Imperial<span>inch</span></figcaption>
          <SectionSVG shape={shape} unit="us" />
          <div className="weight">
            <span className="wv mono">{shape.us.W}</span><span className="wu">lb/ft</span>
          </div>
        </figure>
        <figure className="panel draw">
          <figcaption className="draw-cap">Metric<span>mm</span></figcaption>
          <SectionSVG shape={shape} unit="mt" />
          <div className="weight">
            <span className="wv mono">{shape.mt.W}</span><span className="wu">kg/m</span>
          </div>
        </figure>
      </div>

      <PropsTable shape={shape} defs={defs} />
    </>
  );
}
