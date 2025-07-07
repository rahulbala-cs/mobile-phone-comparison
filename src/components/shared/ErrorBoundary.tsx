import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console and call custom error handler
    console.error('🚨 ErrorBoundary caught an error:', error);
    console.error('📍 Error Info:', errorInfo);
    
    // Update state with error details
    this.setState({
      hasError: true,
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry, LogRocket, etc.
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary">
          <div className="error-boundary__container">
            <div className="error-boundary__icon">⚠️</div>
            <h2 className="error-boundary__title">Oops! Something went wrong</h2>
            <p className="error-boundary__message">
              We're sorry, but an unexpected error occurred. Please try refreshing the page.
            </p>
            
            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-boundary__details">
                <summary className="error-boundary__summary">Error Details</summary>
                <pre className="error-boundary__error-text">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre className="error-boundary__stack-trace">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
            
            <div className="error-boundary__actions">
              <button 
                className="error-boundary__button error-boundary__button--primary"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
              <button 
                className="error-boundary__button error-boundary__button--secondary"
                onClick={() => window.history.back()}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for different components

interface CMSErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
}

export const CMSErrorBoundary: React.FC<CMSErrorBoundaryProps> = ({ children, onRetry }) => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error('🔗 CMS Error:', error.message);
    // Track CMS-specific errors
  };

  const fallback = (
    <div className="cms-error">
      <div className="cms-error__container">
        <div className="cms-error__icon">📡</div>
        <h3 className="cms-error__title">Content Loading Error</h3>
        <p className="cms-error__message">
          Unable to load content from the CMS. This might be a temporary issue.
        </p>
        {onRetry && (
          <button 
            className="cms-error__retry-button"
            onClick={onRetry}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};

interface LivePreviewErrorBoundaryProps {
  children: ReactNode;
}

export const LivePreviewErrorBoundary: React.FC<LivePreviewErrorBoundaryProps> = ({ children }) => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error('🔴 Live Preview Error:', error.message);
    // Track Live Preview specific errors
  };

  const fallback = (
    <div className="live-preview-error">
      <div className="live-preview-error__container">
        <div className="live-preview-error__icon">🔴</div>
        <h3 className="live-preview-error__title">Live Preview Error</h3>
        <p className="live-preview-error__message">
          Live Preview encountered an error. Content will load without editing capabilities.
        </p>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;