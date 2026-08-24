import { useEffect, useState } from 'react';
import { useStore, GROUPS, DB_TYPES } from '../store.js';
import { loadType } from '../lib/dataLoader.js';

export default function Sidebar() {
  const { activeKey, setActiveKey } = useStore();
  const [counts, setCounts] = useState({});

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
      {GROUPS.map((group) => (
        <div className="nav-group" key={group.label}>
          <div className="nav-eyebrow">{group.label}</div>
          {group.items.map((key) => (
            <button
              key={key}
              className={`nav-item${key === activeKey ? ' is-active' : ''}`}
              onClick={() => setActiveKey(key)}
            >
              <span className="nav-name">{key}</span>
              {DB_TYPES.has(key) && (
                <span className="nav-count">{counts[key] ?? ''}</span>
              )}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}
