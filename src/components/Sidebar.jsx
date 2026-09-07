import { useEffect, useState } from 'react';
import { useStore, GRID_GROUPS, BELOW_GROUPS, DB_TYPES, NAV_ITEM_LABEL, GRID_CELL_LABEL } from '../store.js';
import { loadType } from '../lib/dataLoader.js';
import PipeVsHssModal from './PipeVsHssModal.jsx';

// Splits a NAV_ITEM_LABEL like "Checked Plate (ASTM A786)" into a main line
// and a trailing "(...)" qualifier, rendered smaller on its own line below -
// same idea as PropsTable/BHDimTable's main+unit header split, applied here
// so a long standard/spec name in parens doesn't compete visually with the
// item's actual name.
const NAV_LABEL_RE = /^(.*?)\s*(\([^)]*\))$/;
function NavItemLabel({ label }) {
  const m = label.match(NAV_LABEL_RE);
  if (!m) return <span className="nav-name">{label}</span>;
  return (
    <span className="nav-name">
      <span className="nav-name-main">{m[1]}</span>
      <span className="nav-name-sub">{m[2]}</span>
    </span>
  );
}

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
          type="button" className="nav-cell-info" title="Pipe vs HSS(Round) 차이 보기" aria-label="Pipe vs HSS(Round) 차이 보기"
          onClick={(e) => { e.stopPropagation(); onInfo(); }}
        >
          ℹ️
        </button>
      )}
    </td>
  );
}

export default function Sidebar() {
  const { activeKey, setActiveKey, sidebarOpen, closeSidebar } = useStore();
  const [counts, setCounts] = useState({});
  const [showPipeInfo, setShowPipeInfo] = useState(false);
  // Accordion: which BELOW_GROUPS sections are expanded, by label. Starts
  // with whichever group contains the current activeKey open (so a search
  // result or reload lands somewhere visible) and everything else
  // collapsed - the full list of ~21 items across 7 groups plus the grid
  // above doesn't fit in one screen otherwise.
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = BELOW_GROUPS.find((g) => g.items.includes(activeKey));
    return new Set(initial ? [initial.label] : []);
  });
  const toggleGroup = (label) => setOpenGroups((cur) => {
    const next = new Set(cur);
    if (next.has(label)) next.delete(label); else next.add(label);
    return next;
  });

  // If navigation lands on an item inside a currently-collapsed group
  // (search result, back/forward, shape-compare "이동"), open that group
  // automatically so the active item is actually visible.
  useEffect(() => {
    const group = BELOW_GROUPS.find((g) => g.items.includes(activeKey));
    if (group) setOpenGroups((cur) => (cur.has(group.label) ? cur : new Set(cur).add(group.label)));
  }, [activeKey]);

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
    <>
      {/* Only visible/clickable at the <=900px breakpoint, see tokens.css. */}
      <div
        id="sidebar-backdrop"
        className={sidebarOpen ? 'is-open' : ''}
        onClick={closeSidebar}
        aria-hidden="true"
      />
      <nav id="sidebar" className={sidebarOpen ? 'is-open' : ''}>
      <table className="nav-grid">
        <thead>
          <tr>
            <th className="nav-grid-spine" />
            <th>AISC<span className="nav-grid-sub">V16.0</span></th>
            <th>KS<span className="nav-grid-sub">D 3502 : 2022</span></th>
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

      {BELOW_GROUPS.map((group) => {
        const isOpen = openGroups.has(group.label);
        return (
          <div className={`nav-group${isOpen ? ' is-open' : ''}`} key={group.label}>
            <button
              type="button" className="nav-eyebrow nav-eyebrow-toggle"
              aria-expanded={isOpen} onClick={() => toggleGroup(group.label)}
            >
              <span>{group.label}</span>
              <em className="nav-eyebrow-chevron">▾</em>
            </button>
            {isOpen && group.items.map((key) => (
              <button
                key={key}
                className={`nav-item${key === activeKey ? ' is-active' : ''}`}
                onClick={() => setActiveKey(key)}
              >
                <NavItemLabel label={NAV_ITEM_LABEL[key] ?? key} />
                {DB_TYPES.has(key) && (
                  <span className="nav-count">{counts[key] ?? ''}</span>
                )}
              </button>
            ))}
          </div>
        );
      })}

      {showPipeInfo && <PipeVsHssModal onClose={() => setShowPipeInfo(false)} />}
      </nav>
    </>
  );
}
