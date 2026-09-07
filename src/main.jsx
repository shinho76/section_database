import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './styles/tokens.css';

// Last-resort boundary: catches anything that escapes App's own per-page
// boundary (e.g. an error in Header/Sidebar itself, outside the <main>
// subtree). Unlike the inner boundary, there's no "navigate away" recovery
// path here - the app's whole shell may be broken - so this offers a full
// reload instead of a "다시 시도" retry.
function AppCrashFallback() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', gap: 12, padding: 24, textAlign: 'center', fontFamily: 'sans-serif',
    }}
    >
      <p>예상치 못한 오류로 앱을 표시할 수 없습니다.</p>
      <button type="button" onClick={() => window.location.reload()}>새로고침</button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary fallback={() => <AppCrashFallback />}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
