import { Component, type ReactNode } from 'react';
import PrysmCSDashboard from './components/prysmcs';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[PrysmCS] Application error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a2540 0%, #0f172a 100%)',
          fontFamily: "'Inter', -apple-system, sans-serif",
          padding: '24px',
        }}>
          <div style={{
            maxWidth: 440,
            width: '100%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: '40px 32px',
            textAlign: 'center',
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: 22,
            }}>
              !
            </div>
            <h2 style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>
              Something went wrong
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 24px', lineHeight: 1.5 }}>
              The application encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#06b6d4',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 28px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Refresh Page
            </button>
            {this.state.error && (
              <pre style={{
                marginTop: 20,
                padding: 12,
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                fontSize: 11,
                color: 'rgba(255,255,255,0.4)',
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: 120,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <PrysmCSDashboard />
    </ErrorBoundary>
  );
}

export default App;
