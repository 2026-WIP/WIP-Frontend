import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', gap: '16px',
          fontFamily: 'var(--font-ui)', color: 'var(--text-primary)', padding: '24px',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            오류가 발생했습니다
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '480px', lineHeight: 1.6 }}>
            {this.state.error.message}
          </p>
          <pre style={{
            fontSize: '0.75rem', color: 'var(--danger)', background: 'var(--danger-bg)',
            padding: '12px 16px', borderRadius: '0.25rem', maxWidth: '600px',
            overflow: 'auto', textAlign: 'left',
          }}>
            {this.state.error.stack}
          </pre>
          <button
            style={{
              padding: '10px 24px', background: 'var(--accent)', border: 'none',
              borderRadius: '0.25rem', fontFamily: 'var(--font-ui)',
              fontWeight: 700, cursor: 'pointer', fontSize: '0.9375rem',
            }}
            onClick={() => window.location.reload()}
          >
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
