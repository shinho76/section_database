import { useStore } from '../store.js';
import SearchBox from './SearchBox.jsx';
import BomModal from './BomModal.jsx';

// Windows registers the `calculator:` URI scheme for the built-in Calculator
// app. Browsers can't spawn native processes directly, so this is the only
// way a web page can launch it - the OS/browser will show its own "open
// Calculator?" permission prompt the first time.
function openCalculator() {
  window.location.href = 'calculator:';
}

const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdjALpAY7ClYKv0--W5LaIdXYk9d1VxI4NXmI12SEJlxRUATQ/viewform';

export default function Header() {
  const { theme, toggleTheme, sidebarOpen, toggleSidebar, bom, bomOpen, toggleBom } = useStore();

  return (
    <header>
      <button
        id="sidebar-toggle" type="button" aria-label="메뉴 열기/닫기"
        aria-expanded={sidebarOpen} onClick={toggleSidebar}
      >
        ☰
      </button>
      <span className="brand">SteelWeight</span>
      <span className="badge">AISC v16.0</span>
      <SearchBox />
      <button id="calculator" title="계산기 열기" onClick={openCalculator}>🔢</button>
      <a id="feedback" title="피드백 보내기" href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer">💬</a>
      <button id="bom" title="적산 바구니" onClick={toggleBom}>
        🧺{bom.length > 0 && <span className="bom-count">{bom.length}</span>}
      </button>
      <button id="theme" onClick={toggleTheme}>
        {theme === 'dark' ? '☀ Light' : '☾ Dark'}
      </button>
      {bomOpen && <BomModal onClose={toggleBom} />}
    </header>
  );
}
