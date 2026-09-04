import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional fallback to render instead of the default error UI */
  fallback?: React.ReactNode;
  /** If true, show a minimal full-page error instead of the section-level error */
  fullPage?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * React Error Boundary — catches uncaught render-time exceptions anywhere
 * in its subtree and displays a controlled government-style error page
 * instead of an unexplained blank white screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    // Log to console for developer visibility
    console.error('[ErrorBoundary] Uncaught render error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReturnToDashboard = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Navigate to dashboard — use window.location for a clean reload
    window.location.href = '/dashboard';
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const isDev = import.meta.env.DEV;
    const { error, errorInfo } = this.state;

    if (this.props.fullPage) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F5F6F8',
            fontFamily: "'Inter', 'Noto Sans', system-ui, sans-serif",
            padding: '2rem',
          }}
        >
          {this.renderErrorCard(isDev, error, errorInfo)}
        </div>
      );
    }

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 1rem',
          minHeight: '40vh',
        }}
      >
        {this.renderErrorCard(isDev, error, errorInfo)}
      </div>
    );
  }

  renderErrorCard(isDev: boolean, error: Error | null, errorInfo: React.ErrorInfo | null) {
    return (
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          border: '1px solid #D9DDE3',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Header stripe */}
        <div
          style={{
            height: '4px',
            background: 'linear-gradient(90deg, #FF9933 33%, #FFFFFF 33% 66%, #138808 66%)',
          }}
        />

        {/* Content */}
        <div style={{ padding: '2rem' }}>
          {/* Icon */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#B72025"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#0B2A4A',
              marginBottom: '0.5rem',
              lineHeight: 1.3,
            }}
          >
            Something went wrong while loading this section.
          </h2>

          <p
            style={{
              fontSize: '13px',
              color: '#5F6368',
              lineHeight: 1.5,
              marginBottom: '1.5rem',
            }}
          >
            An unexpected error occurred. This incident has been logged. You may retry loading
            the current section or return to the dashboard.
          </p>

          {/* Dev-mode error details */}
          {isDev && error && (
            <details
              style={{
                marginBottom: '1.5rem',
                border: '1px solid #E5E7EB',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <summary
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#B72025',
                  backgroundColor: '#FEF2F2',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                Development Diagnostics
              </summary>
              <div style={{ padding: '0.75rem', fontSize: '11px', fontFamily: 'monospace' }}>
                <div style={{ color: '#B72025', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {error.name}: {error.message}
                </div>
                {errorInfo?.componentStack && (
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: '#475569',
                      maxHeight: '200px',
                      overflow: 'auto',
                      margin: 0,
                      fontSize: '10px',
                      lineHeight: 1.4,
                    }}
                  >
                    {errorInfo.componentStack}
                  </pre>
                )}
              </div>
            </details>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: '#0B2A4A',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                transition: 'background-color 150ms',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0D3B6B')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0B2A4A')}
            >
              Retry
            </button>
            <button
              onClick={this.handleReturnToDashboard}
              style={{
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#0B2A4A',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD2DE',
                borderRadius: '3px',
                cursor: 'pointer',
                transition: 'background-color 150ms',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F0F4F8')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              Return to Dashboard
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.5rem 2rem',
            backgroundColor: '#F8F9FA',
            borderTop: '1px solid #E5E7EB',
            fontSize: '10px',
            color: '#9CA3AF',
          }}
        >
          FairBid — Government of India Procurement Intelligence Platform
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
