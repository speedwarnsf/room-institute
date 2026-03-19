/**
 * Enhanced Error Boundary for Production
 * Catches JavaScript errors anywhere in the child component tree and displays fallback UI
 */
import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { analytics } from '../services/analytics';
import { getTranslation } from '../i18n/I18nContext';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to analytics
    analytics.track('error_displayed', {
      errorCode: 'REACT_ERROR_BOUNDARY',
      errorMessage: error.message,
      isRetryable: true,
      componentStack: errorInfo.componentStack,
      errorStack: error.stack,
      errorId: this.state.errorId,
      retryCount: this.state.retryCount,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: prevState.retryCount + 1,
      }));

      analytics.track('error_dismissed', {
        action: 'retry',
        retryCount: this.state.retryCount + 1,
        errorId: this.state.errorId,
      });
    }
  };

  handleReload = () => {
    analytics.track('error_dismissed', {
      action: 'reload',
      errorId: this.state.errorId,
    });
    window.location.reload();
  };

  handleGoHome = () => {
    analytics.track('error_dismissed', {
      action: 'home',
      errorId: this.state.errorId,
    });
    window.location.href = '/';
  };

  copyErrorInfo = async () => {
    const errorInfo = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2));
      // Show brief success indication
      const button = document.getElementById('copy-error-btn');
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy error info:', err);
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const isQuotaExceeded = this.state.error?.message?.includes('QuotaExceeded');

      return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="bg-red-50 dark:bg-red-900/30 p-4">
                <AlertTriangle className="w-12 h-12 text-red-500 dark:text-red-400" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                {isQuotaExceeded ? getTranslation('error.storageFullTitle') : getTranslation('error.somethingWentWrong')}
              </h1>
              <p className="text-stone-600 dark:text-stone-400">
                {isQuotaExceeded ? getTranslation('error.storageFullDesc') : getTranslation('error.unexpectedError')}
              </p>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-stone-100 dark:bg-stone-800 p-4 text-left">
                <h3 className="font-medium text-stone-900 dark:text-stone-100 mb-2">
                  {getTranslation('error.errorDetails')}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 font-mono break-all">
                  {this.state.error.message}
                </p>
                {this.state.errorId && (
                  <p className="text-xs text-stone-500 dark:text-stone-500 mt-2">
                    ID: {this.state.errorId}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {canRetry && !isQuotaExceeded && (
                <button
                  onClick={this.handleRetry}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {getTranslation('error.tryAgainCount').replace('{count}', String(this.maxRetries - this.state.retryCount))}
                </button>
              )}

              <button
                onClick={this.handleGoHome}
                className="bg-stone-600 hover:bg-stone-700 text-white px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>

              <button
                onClick={this.handleReload}
                className="bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
            </div>

            {/* Copy Error Info (Development/Support) */}
            {process.env.NODE_ENV === 'development' && (
              <button
                id="copy-error-btn"
                onClick={this.copyErrorInfo}
                className="text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300 underline flex items-center justify-center gap-1 transition-colors"
              >
                <Bug className="w-3 h-3" />
                Copy Error Info
              </button>
            )}

            {/* Helpful Tips */}
            {!isQuotaExceeded && (
              <div className="text-sm text-stone-500 dark:text-stone-400">
                <p>{getTranslation('error.persistsIntro')}</p>
                <ul className="mt-1 space-y-1">
                  <li>• {getTranslation('error.tipRefresh')}</li>
                  <li>• {getTranslation('error.tipInternet')}</li>
                  <li>• {getTranslation('error.tipCache')}</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}