import { Component } from 'react';

/** Catches render/lifecycle errors in its subtree so one broken shape's
 * calculation (a malformed data row, a NaN propagating into a SVG path,
 * etc.) shows a recoverable message instead of taking the whole app down
 * to a blank white screen with no way back.
 *
 * `resetKeys`: when any value in this array changes (compared shallowly),
 * an active error is cleared automatically - used to reset the boundary
 * when the user navigates to a different page/shape, so they don't have
 * to reload just to leave the page that crashed.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (!this.state.error) return;
    const prev = prevProps.resetKeys || [];
    const next = this.props.resetKeys || [];
    if (prev.length !== next.length || prev.some((v, i) => v !== next[i])) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return this.props.fallback
        ? this.props.fallback(this.state.error, () => this.setState({ error: null }))
        : (
          <div className="panel" style={{ padding: 24 }}>
            <p className="note" style={{ borderTop: 'none', padding: 0 }}>
              ⚠ 이 화면을 표시하는 중 오류가 발생했습니다. 다른 단면·페이지로 이동하면 자동으로
              복구됩니다. 문제가 계속되면 새로고침해 주세요.
            </p>
            <button type="button" className="btn" style={{ marginTop: 10 }} onClick={() => this.setState({ error: null })}>
              다시 시도
            </button>
          </div>
        );
    }
    return this.props.children;
  }
}
