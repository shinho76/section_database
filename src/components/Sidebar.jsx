import { useEffect, useState } from 'react';
import { useStore, GRID_GROUPS, BELOW_GROUPS, DB_TYPES, NAV_ITEM_LABEL, GRID_CELL_LABEL } from '../store.js';
import { loadType } from '../lib/dataLoader.js';
import PipeVsHssModal from './PipeVsHssModal.jsx';

function GridCell({ typeKey, activeKey, setActiveKey, counts, rowSpan, onInfo }) {
  if (!typeKey) return <td className="nav-grid-cell" />;
  const label = GRID_CELL_LABEL[typeKey] ?? (typeKey.startsWith('KS') ? typeKey.slice(2) : typeKey);
  return (
    <td className="nav-grid-cell" rowSpan={rowSpan}>
      <button
        className={`nav-cell-btn${activeKey === typeKey ? ' is-active' : ''}`}
        onClick={() => setActiveKey(typeKey)}
      >
        <span>{label}</span>
        <em>{counts[typeKey] ?? ''}</em>
      </button>
      {onInfo && (
        <button
          type="button" className="nav-cell-info" title="Pipe vs HSS(Round) 차이 보기"
          onClick={(e) => { e.stopPropagation(); onInfo(); }}
        >
          ℹ️
        </button>
      )}
    </td>
  );
}

export default function Sidebar() {
  const { activeKey, setActiveKey } = useStore();
  const [counts, setCounts] = useState({});
  const [showPipeInfo, setShowPipeInfo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        [...DB_TYPES].map(async (t) => [t, (await loadType(t)).length]),
      );
      if (!cancelled) setCounts(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <nav id="sidebar">
      <button
        type="button"
        className={`nav-unit-conv-btn${activeKey === 'UNITCONV' ? ' is-active' : ''}`}
        onClick={() => setActiveKey('UNITCONV')}
      >
        UNIT CONVERSION
      </button>

      <table className="nav-grid">
        <thead>
          <tr>
            <th className="nav-grid-spine" />
            <th>AISC V16.0</th>
            <th>KS</th>
          </tr>
        </thead>
        <tbody>
          {GRID_GROUPS.map((g) => {
            const rows = Math.max(g.aisc.length, g.ks.length);
            const oneToOne = g.ks.length === g.aisc.length;
            return Array.from({ length: rows }).map((_, i) => (
              <tr key={`${g.label}-${i}`}>
                {i === 0 && (
                  <td className="nav-grid-spine" rowSpan={rows}><span>{g.label}</span></td>
                )}
                <GridCell
                  typeKey={g.aisc[i]}
                  activeKey={activeKey}
                  setActiveKey={setActiveKey}
                  counts={counts}
                  onInfo={g.aisc[i] === 'PIPE' ? () => setShowPipeInfo(true) : null}
                />
                {oneToOne
                  ? (
                    <GridCell
                      typeKey={g.ks[i]}
                      activeKey={activeKey}
                      setActiveKey={setActiveKey}
                      counts={counts}
                    />
                  )
                  : (i === 0 && (
                    <GridCell
                      typeKey={g.ks[0]}
                      activeKey={activeKey}
                      setActiveKey={setActiveKey}
                      counts={counts}
                      rowSpan={rows}
                    />
                  ))}
              </tr>
            ));
          })}
        </tbody>
      </table>

      {BELOW_GROUPS.map((group) => (
        <div className="nav-group" key={group.label}>
          <div className="nav-eyebrow">{group.label}</div>
          {group.items.map((key) => (
            <button
              key={key}
              className={`nav-item${key === activeKey ? ' is-active' : ''}`}
              onClick={() => setActiveKey(key)}
            >
              <span className="nav-name">{NAV_ITEM_LABEL[key] ?? key}</span>
              {DB_TYPES.has(key) && (
                <span className="nav-count">{counts[key] ?? ''}</span>
              )}
            </button>
          ))}
        </div>
      ))}

      {showPipeInfo && <PipeVsHssModal onClose={() => setShowPipeInfo(false)} />}
    </nav>
  );
}
