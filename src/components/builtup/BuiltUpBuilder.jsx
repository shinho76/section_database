import { useState } from 'react';
import CustomHPanel from './CustomHPanel.jsx';
import HPlusTPanel from './HPlusTPanel.jsx';

const MODES = [
  { key: 'custom', label: '① 4수치 H형강' },
  { key: 'db-t', label: '② H-SHAPE + T-BAR' },
  { key: 'custom-t', label: '③ 커스텀 H + T-BAR' },
];

export default function BuiltUpBuilder() {
  const [mode, setMode] = useState('custom');

  return (
    <>
      <div className="detail-head">
        <div>
          <h1 className="mono">BH — Built-up 조립단면 구성기</h1>
        </div>
      </div>

      <div className="deck-tabs">
        {MODES.map((m) => (
          <span
            key={m.key}
            className={`deck-tab${mode === m.key ? ' is-active' : ''}`}
            onClick={() => setMode(m.key)}
          >
            {m.label}
          </span>
        ))}
      </div>

      {mode === 'custom' && <CustomHPanel />}
      {mode === 'db-t' && <HPlusTPanel baseKind="db" />}
      {mode === 'custom-t' && <HPlusTPanel baseKind="custom" />}
    </>
  );
}
