import { useStore } from '../store.js';
import SearchBox from './SearchBox.jsx';

export default function Header() {
  const { theme, toggleTheme } = useStore();

  return (
    <header>
      <span className="brand">SECTION DATABASE</span>
      <span className="badge">AISC v16.0</span>
      <SearchBox />
      <button id="theme" onClick={toggleTheme}>
        {theme === 'dark' ? '☀ Light' : '☾ Dark'}
      </button>
    </header>
  );
}
