import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Always stringify error for logging
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', String(error?.message || JSON.stringify(error) || error), errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, color: 'var(--error)', fontFamily: 'monospace' }}>
          <h2>Something went wrong.</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error?.message || JSON.stringify(this.state.error) || 'Unknown error')}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
