import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Write error to local storage so a script can read it
    try {
      localStorage.setItem('last_react_error', JSON.stringify({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      }));
    } catch (e) {}
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: '#ff000020', color: 'red', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>React Error! (Black Screen Prevented)</h2>
          <p><strong>{this.state.error?.message}</strong></p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{this.state.error?.stack}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, marginTop: 20 }}>{this.state.errorInfo?.componentStack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
