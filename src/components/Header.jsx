import { useStore, DB_TYPES } from '../store.js';
import { findByQuery } from '../lib/dataLoader.js';

export default function Header() {
  const { query, setQuery, setActiveKey, selectShape, theme, toggleTheme } = useStore();

  const onInput = async (e) => {
    const q = e.target.value;
    setQuery(q);
    const hit = await findByQuery(q);
    if (hit) {
      setActiveKey(hit.type);
      selectShape(hit);
    }
  };

  return (
    <header>
      <span className="brand">SECTION DATABASE</span>
      <span className="badge">AISC v16.0</span>
      <input
        id="search"
        type="search"
        placeholder="Search  W24X370  ·  711×348  ·  Pipe26STD"
        autoComplete="off"
        value={query}
        onChange={onInput}
      />
      <button id="theme" onClick={toggleTheme}>
        {theme === 'dark' ? '☀ Light' : '☾ Dark'}
      </button>
    </header>
  );
}
