import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore, TYPE_LABEL, NAV_ITEM_LABEL, DB_TYPES, displayType } from '../store.js';
import { searchAll, resolveShape } from '../lib/dataLoader.js';

const HISTORY_KEY = 'aisc-search-history';
const MAX_HISTORY = 8;
const MAX_GROUP_ITEMS = 5;
const MAX_GROUPS = 6;

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function pushHistory(entry) {
  try {
    const cur = loadHistory().filter((h) => !(h.name === entry.name && h.type === entry.type));
    cur.unshift({ name: entry.name, ks: entry.ks, type: entry.type });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(cur.slice(0, MAX_HISTORY)));
  } catch {
    // localStorage unavailable — recent-search history just won't persist
  }
}

function groupResults(rows) {
  const byType = new Map();
  for (const r of rows) {
    if (!byType.has(r.type)) byType.set(r.type, []);
    byType.get(r.type).push(r);
  }
  return [...byType.entries()].slice(0, MAX_GROUPS).map(([type, items]) => ({
    type, items: items.slice(0, MAX_GROUP_ITEMS), total: items.length,
  }));
}

export default function SearchBox() {
  const { query, setQuery, setActiveKey, selectShape } = useStore();
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);
  const boxRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(() => {
      searchAll(query).then(setResults);
    }, 120);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const groups = useMemo(() => groupResults(results), [results]);

  const goto = async (entry) => {
    // Non-shape reference tables (WWR, rebar, bolts, purlin, ...) don't have
    // a per-row detail view to select into - just jump to their page.
    if (!DB_TYPES.has(entry.type)) {
      setActiveKey(entry.type);
      setQuery('');
      setOpen(false);
      pushHistory(entry);
      setHistory(loadHistory());
      return;
    }
    const shape = await resolveShape(entry);
    if (!shape) return;
    setActiveKey(entry.type);
    selectShape(shape);
    setQuery('');
    setOpen(false);
    pushHistory(entry);
    setHistory(loadHistory());
  };

  const showHistory = open && !query.trim() && history.length > 0;
  const showResults = open && query.trim() && groups.length > 0;
  const showEmpty = open && query.trim() && results.length === 0;

  return (
    <div className="search-box" ref={boxRef}>
      <input
        id="search"
        ref={inputRef}
        type="search"
        placeholder="Search  W24X370  ·  711×348  ·  Pipe26STD   (Ctrl+K)"
        autoComplete="off"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') setOpen(false); }}
      />
      {(showHistory || showResults || showEmpty) && (
        <div className="search-drop">
          {showHistory && (
            <div className="search-group">
              <div className="search-group-head">최근 검색</div>
              {history.map((h, i) => (
                <button key={`${h.type}-${h.name}-${i}`} className="search-row" onClick={() => goto(h)}>
                  <span className="search-row-name mono">{h.name}</span>
                  <span className="search-row-type">{displayType(h.type)}</span>
                </button>
              ))}
            </div>
          )}
          {showResults && groups.map((g) => (
            <div className="search-group" key={g.type}>
              <div className="search-group-head">{TYPE_LABEL[g.type] || NAV_ITEM_LABEL[g.type] || g.type}</div>
              {g.items.map((s, i) => (
                <button key={`${s.type}-${s.name}-${i}`} className="search-row" onClick={() => goto(s)}>
                  <span className="search-row-name mono">{s.name}</span>
                  <span className="search-row-ks mono">{s.ks}</span>
                  <span className="search-row-type">{displayType(s.type)}</span>
                </button>
              ))}
              {g.total > MAX_GROUP_ITEMS && (
                <div className="search-group-more">+{g.total - MAX_GROUP_ITEMS}개 더 (Enter로 전체 보기)</div>
              )}
            </div>
          ))}
          {showEmpty && <div className="search-empty">일치하는 단면이 없습니다.</div>}
        </div>
      )}
    </div>
  );
}
