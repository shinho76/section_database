import { useStore } from '../store.js';
import SearchBox from './SearchBox.jsx';

// Windows registers the `calculator:` URI scheme for the built-in Calculator
// app. Browsers can't spawn native processes directly, so this is the only
// way a web page can launch it - the OS/browser will show its own "open
// Calculator?" permission prompt the first time.
function openCalculator() {
  window.location.href = 'calculator:';
}

const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdjALpAY7ClYKv0--W5LaIdXYk9d1VxI4NXmI12SEJlxRUATQ/viewform';

export default function Header() {
  const { theme, toggleTheme } = useStore();

  return (
    <header>
      <span className="brand">SECTION DATABASE</span>
      <span className="badge">AISC v16.0</span>
      <SearchBox />
      <button id="calculator" title="계산기 열기" onClick={openCalculator}>🧮</button>
      <a id="feedback" title="피드백 보내기" href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer">💬</a>
      <button id="theme" onClick={toggleTheme}>
        {theme === 'dark' ? '☀ Light' : '☾ Dark'}
      </button>
    </header>
  );
}
