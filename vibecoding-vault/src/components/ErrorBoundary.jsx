/**
 * ErrorBoundary - React Error Boundary with Telemetry Integration
 * 
 * Catches React component errors and reports them to TelemetryService
 */

import React, { Component } from 'react';
import telemetry from '../services/TelemetryService';
import { safeMap } from '../utils/safeArrayHelpers';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to telemetry service
    const capturedError = telemetry.captureError(error, {
      type: 'react-error-boundary',
      componentStack: errorInfo.componentStack,
      props: this.props.errorMetadata || {},
      retryCount: this.state.retryCount
    });

    // Update state with error details
    this.setState({
      error,
      errorInfo,
      errorId: capturedError.id
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, capturedError);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 React Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error ID:', capturedError.id);
      console.groupEnd();
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: this.state.retryCount + 1
    });

    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReportIssue = async () => {
    if (this.state.errorId) {
      try {
        // Get AI insights for the error
        const insights = await telemetry.getAIInsights(this.state.errorId);
        
        // Show insights to user or open issue reporter
        if (this.props.onReportIssue) {
          this.props.onReportIssue(this.state.error, insights);
        } else {
          alert('Error reported! Our team will investigate this issue.');
        }
      } catch (err) {
        console.error('Failed to report issue:', err);
      }
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo,
          this.handleReset,
          this.handleReportIssue
        );
      }

      // Default fallback UI
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.icon}>⚠️</div>
            <h1 style={styles.title}>Oops! Something went wrong</h1>
            <p style={styles.message}>
              {this.props.message || "We're sorry, but something unexpected happened."}
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details (Development Only)</summary>
                <div style={styles.errorInfo}>
                  <h3>Error:</h3>
                  <pre style={styles.pre}>{this.state.error?.toString()}</pre>
                  
                  <h3>Component Stack:</h3>
                  <pre style={styles.pre}>{this.state.errorInfo?.componentStack}</pre>
                  
                  <h3>Error ID:</h3>
                  <code>{this.state.errorId}</code>
                </div>
              </details>
            )}
            
            <div style={styles.actions}>
              <button
                onClick={this.handleReset}
                style={{...styles.button, ...styles.primaryButton}}
              >
                Try Again
              </button>
              
              <button
                onClick={this.handleReportIssue}
                style={{...styles.button, ...styles.secondaryButton}}
              >
                Report Issue
              </button>
              
              {this.props.showRefresh !== false && (
                <button
                  onClick={() => window.location.reload()}
                  style={{...styles.button, ...styles.secondaryButton}}
                >
                  Refresh Page
                </button>
              )}
            </div>
            
            {this.state.retryCount > 2 && (
              <p style={styles.retryWarning}>
                This error keeps happening. Please try refreshing the page or contact support.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Styles
const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    margin: '20px 0'
  },
  content: {
    textAlign: 'center',
    maxWidth: '600px'
  },
  icon: {
    fontSize: '48px',
    marginBottom: '20px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '10px'
  },
  message: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '30px'
  },
  details: {
    textAlign: 'left',
    backgroundColor: '#fee',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '20px',
    border: '1px solid #fcc'
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: '10px'
  },
  errorInfo: {
    marginTop: '15px'
  },
  pre: {
    backgroundColor: '#fff',
    padding: '10px',
    borderRadius: '4px',
    overflow: 'auto',
    fontSize: '12px',
    lineHeight: '1.5',
    border: '1px solid #e5e7eb'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  button: {
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s'
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    '&:hover': {
      backgroundColor: '#2563eb'
    }
  },
  secondaryButton: {
    backgroundColor: '#e5e7eb',
    color: '#374151',
    '&:hover': {
      backgroundColor: '#d1d5db'
    }
  },
  retryWarning: {
    marginTop: '20px',
    padding: '10px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: '6px',
    fontSize: '14px'
  }
};

// Higher-order component for easy wrapping
export function withErrorBoundary(Component, errorBoundaryProps = {}) {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Async Error Boundary for handling async errors
export class AsyncErrorBoundary extends ErrorBoundary {
  componentDidMount() {
    // Listen for async errors
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  handleUnhandledRejection = (event) => {
    // Check if this rejection is from a child component
    if (this.props.catchAsync !== false) {
      this.componentDidCatch(
        new Error(event.reason?.message || 'Async error'),
        { componentStack: 'Async operation' }
      );
    }
  };
}

// App-level Error Boundary with more features
export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errors: [],
      currentErrorIndex: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorEntry = {
      id: Date.now(),
      error,
      errorInfo,
      timestamp: new Date(),
      resolved: false
    };

    // Track in telemetry
    telemetry.captureError(error, {
      type: 'app-error-boundary',
      ...errorInfo
    });

    // Add to error list
    this.setState(prevState => ({
      errors: [...prevState.errors, errorEntry],
      currentErrorIndex: prevState.errors.length
    }));
  }

  handleDismissError = (errorId) => {
    this.setState(prevState => ({
      errors: prevState.errors.map(e => 
        e.id === errorId ? { ...e, resolved: true } : e
      )
    }));

    // Check if all errors are resolved
    const allResolved = this.state.errors.every(e => e.resolved || e.id === errorId);
    if (allResolved) {
      this.setState({ hasError: false });
    }
  };

  handlePreviousError = () => {
    this.setState(prevState => ({
      currentErrorIndex: Math.max(0, prevState.currentErrorIndex - 1)
    }));
  };

  handleNextError = () => {
    this.setState(prevState => ({
      currentErrorIndex: Math.min(prevState.errors.length - 1, prevState.currentErrorIndex + 1)
    }));
  };

  render() {
    if (this.state.hasError && this.state.errors.length > 0) {
      const currentError = this.state.errors[this.state.currentErrorIndex];
      const unresolvedErrors = this.state.errors.filter(e => !e.resolved);

      return (
        <div style={appStyles.overlay}>
          <div style={appStyles.modal}>
            <div style={appStyles.header}>
              <h2 style={appStyles.title}>Application Error</h2>
              {unresolvedErrors.length > 1 && (
                <div style={appStyles.errorCount}>
                  Error {this.state.currentErrorIndex + 1} of {this.state.errors.length}
                </div>
              )}
            </div>

            <div style={appStyles.body}>
              <div style={appStyles.errorMessage}>
                {currentError.error.toString()}
              </div>
              
              <div style={appStyles.timestamp}>
                {currentError.timestamp.toLocaleString()}
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details style={appStyles.details}>
                  <summary>Stack Trace</summary>
                  <pre style={appStyles.stack}>
                    {currentError.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div style={appStyles.footer}>
              {unresolvedErrors.length > 1 && (
                <div style={appStyles.navigation}>
                  <button
                    onClick={this.handlePreviousError}
                    disabled={this.state.currentErrorIndex === 0}
                    style={appStyles.navButton}
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={this.handleNextError}
                    disabled={this.state.currentErrorIndex === this.state.errors.length - 1}
                    style={appStyles.navButton}
                  >
                    Next →
                  </button>
                </div>
              )}

              <div style={appStyles.actions}>
                <button
                  onClick={() => this.handleDismissError(currentError.id)}
                  style={appStyles.dismissButton}
                >
                  Dismiss
                </button>
                <button
                  onClick={() => window.location.reload()}
                  style={appStyles.reloadButton}
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Styles for AppErrorBoundary
const appStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#dc2626',
    margin: 0
  },
  errorCount: {
    fontSize: '14px',
    color: '#6b7280'
  },
  body: {
    padding: '20px',
    flex: 1,
    overflow: 'auto'
  },
  errorMessage: {
    fontSize: '16px',
    color: '#1f2937',
    marginBottom: '10px',
    fontFamily: 'monospace'
  },
  timestamp: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '20px'
  },
  details: {
    marginTop: '20px'
  },
  stack: {
    backgroundColor: '#f3f4f6',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '200px'
  },
  footer: {
    padding: '20px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  navigation: {
    display: 'flex',
    gap: '10px'
  },
  navButton: {
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  actions: {
    display: 'flex',
    gap: '10px'
  },
  dismissButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  reloadButton: {
    padding: '8px 16px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

export default ErrorBoundary;