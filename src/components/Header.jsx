import { useStore } from '../store.js';

export default function Header() {
  const { query, setQuery, theme, toggleTheme } = useStore();

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
        onChange={(e) => setQuery(e.target.value)}
      />
      <button id="theme" onClick={toggleTheme}>
        {theme === 'dark' ? '☀ Light' : '☾ Dark'}
      </button>
    </header>
  );
}
