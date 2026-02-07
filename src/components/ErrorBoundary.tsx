import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Bug } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback UI to render instead of default */
  fallback?: ReactNode;
  /** Custom fallback component that receives error details */
  FallbackComponent?: React.ComponentType<FallbackProps>;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Reset keys - when these change, the error boundary resets */
  resetKeys?: any[];
  /** Level of the error boundary for styling */
  level?: 'page' | 'section' | 'widget';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export interface FallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
}

// ============================================
// ERROR BOUNDARY CLASS COMPONENT
// ============================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log to console for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state when resetKeys change
    if (this.state.hasError && this.props.resetKeys) {
      const hasChanged = this.props.resetKeys.some(
        (key, i) => key !== prevProps.resetKeys?.[i]
      );
      if (hasChanged) {
        this.resetError();
      }
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback component
      if (this.props.FallbackComponent && this.state.error) {
        return (
          <this.props.FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.resetError}
          />
        );
      }

      // Custom static fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback based on level
      const level = this.props.level || 'page';
      return (
        <DefaultErrorFallback
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          level={level}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================
// DEFAULT ERROR FALLBACK UI
// ============================================

function DefaultErrorFallback({
  error,
  errorInfo,
  resetError,
  level = 'page',
}: FallbackProps & { level?: 'page' | 'section' | 'widget' }) {
  const [showDetails, setShowDetails] = React.useState(false);

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/dashboard/connections';
  };

  // Widget-level: compact inline error
  if (level === 'widget') {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span className="truncate">Something went wrong</span>
        <button
          onClick={resetError}
          className="ml-auto shrink-0 px-2 py-1 text-xs rounded bg-red-500/20 hover:bg-red-500/30 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Section-level: medium card
  if (level === 'section') {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-[#1B2431] border border-red-500/20">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
        <p className="text-sm text-gray-400 text-center mb-4 max-w-md">
          This section encountered an error. You can try again or continue using other parts of the app.
        </p>
        {error?.message && (
          <p className="text-xs text-red-400/80 font-mono mb-4 px-3 py-2 rounded bg-red-500/5 border border-red-500/10 max-w-md truncate">
            {error.message}
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={resetError}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Page-level: full page error
  return (
    <div className="min-h-screen bg-[#1B2431] flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/10 flex items-center justify-center border border-red-500/20">
              <Bug className="w-10 h-10 text-red-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <span className="text-red-400 text-xs font-bold">!</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-3">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            The page encountered an unexpected error. Don't worry — your data is safe.
            You can try refreshing or go back to the dashboard.
          </p>
        </div>

        {/* Error Details (collapsible) */}
        {error?.message && (
          <div className="mb-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mx-auto"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showDetails ? 'Hide' : 'Show'} error details
            </button>
            {showDetails && (
              <div className="mt-3 p-4 rounded-xl bg-[#273142] border border-white/5 overflow-auto max-h-48 scrollbar-thin">
                <p className="text-xs text-red-400 font-mono break-all mb-2">
                  {error.message}
                </p>
                {errorInfo?.componentStack && (
                  <pre className="text-[10px] text-gray-500 font-mono whitespace-pre-wrap">
                    {errorInfo.componentStack.slice(0, 500)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={resetError}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={handleReload}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Page
          </button>
          <button
            onClick={handleGoHome}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>

        {/* Branding */}
        <p className="text-center text-[10px] text-gray-600 mt-8">
          ChatSQL • If this issue persists, please contact support.
        </p>
      </div>
    </div>
  );
}

// ============================================
// NOT FOUND PAGE (404)
// ============================================

export function NotFoundPage() {
  const handleGoHome = () => {
    window.location.href = '/dashboard/connections';
  };

  return (
    <div className="min-h-screen bg-[#1B2431] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center border border-blue-500/20">
            <span className="text-4xl font-bold text-blue-400">404</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-gray-400 text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={handleGoHome}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          <Home className="w-4 h-4" />
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

export default ErrorBoundary;
