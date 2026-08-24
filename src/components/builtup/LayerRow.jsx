import { useEffect, useState } from 'react';
import { DB_TYPES } from '../../store.js';
import { loadType } from '../../lib/dataLoader.js';
import { manualHProps } from './compose.js';

export default function LayerRow({ layer, index, onChange, onRemove }) {
  const [typeShapes, setTypeShapes] = useState([]);

  useEffect(() => {
    if (layer.kind === 'db' && layer.dbType) {
      loadType(layer.dbType).then(setTypeShapes);
    }
  }, [layer.kind, layer.dbType]);

  const setKind = (kind) => onChange({ ...layer, kind, props: null });

  const setDbType = (dbType) => onChange({ ...layer, dbType, dbName: '', props: null });

  const setDbShape = (name) => {
    const shape = typeShapes.find((s) => s.name === name);
    if (!shape) return onChange({ ...layer, dbName: name, props: null });
    const us = shape.us;
    const props = {
      A: parseFloat(us.A), Ix: parseFloat(us.Ix), Iy: parseFloat(us.Iy),
      W: parseFloat(us.W), d: parseFloat(us.d || us.Ht || us.OD || 0),
      bf: parseFloat(us.bf || us.B || 0), tw: parseFloat(us.tw || 0), tf: parseFloat(us.tf || 0),
    };
    onChange({ ...layer, dbName: name, props, label: shape.name });
  };

  const setManual = (field, value) => {
    const dims = { ...layer.dims, [field]: parseFloat(value) || 0 };
    const complete = dims.d && dims.bf && dims.tw && dims.tf;
    const props = complete ? manualHProps(dims) : null;
    onChange({ ...layer, dims, props, label: `d${dims.d}×b${dims.bf}×${dims.tw}×${dims.tf}` });
  };

  const setYOffset = (value) => onChange({ ...layer, yOffset: parseFloat(value) || 0 });

  return (
    <div>
      <div className="layer-row">
        <span className="layer-idx">{index + 1}</span>
        <div className="layer-main">
          <select value={layer.kind} onChange={(e) => setKind(e.target.value)}>
            <option value="db">DB에서 선택</option>
            <option value="manual">수동 입력 (H형)</option>
          </select>
        </div>
        <span className="layer-tag">{layer.props ? `A=${layer.props.A.toFixed(2)}in²` : '미완성'}</span>
        <button className="layer-del" onClick={onRemove} aria-label="레이어 삭제">×</button>
      </div>

      {layer.kind === 'db' ? (
        <div className="field-row">
          <label>Type
            <select value={layer.dbType || ''} onChange={(e) => setDbType(e.target.value)}>
              <option value="">선택…</option>
              {[...DB_TYPES].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>Shape
            <select value={layer.dbName || ''} onChange={(e) => setDbShape(e.target.value)} disabled={!layer.dbType}>
              <option value="">선택…</option>
              {typeShapes.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </label>
          <label>y offset (in)
            <input type="number" value={layer.yOffset} onChange={(e) => setYOffset(e.target.value)} />
          </label>
        </div>
      ) : (
        <div className="field-row">
          <label>d (in)<input type="number" value={layer.dims?.d || ''} onChange={(e) => setManual('d', e.target.value)} /></label>
          <label>bf (in)<input type="number" value={layer.dims?.bf || ''} onChange={(e) => setManual('bf', e.target.value)} /></label>
          <label>tw (in)<input type="number" value={layer.dims?.tw || ''} onChange={(e) => setManual('tw', e.target.value)} /></label>
          <label>tf (in)<input type="number" value={layer.dims?.tf || ''} onChange={(e) => setManual('tf', e.target.value)} /></label>
          <label>y offset (in)<input type="number" value={layer.yOffset} onChange={(e) => setYOffset(e.target.value)} /></label>
        </div>
      )}
    </div>
  );
}
