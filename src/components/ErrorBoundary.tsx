import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  /** Called when user clicks "Try again" */
  onReset?: () => void;
  /** Custom fallback UI (overrides default) */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Reusable error boundary component.
 *
 * Catches render errors in child tree, logs via structured logger
 * (Sentry-ready when plugged in), and shows a recovery UI.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <Outlet />
 *   </ErrorBoundary>
 *
 *   <ErrorBoundary onReset={() => refetch()} fallback={<CustomError />}>
 *     <FeatureComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error(error, {
      componentStack: info.componentStack ?? undefined,
      digest: info.digest ?? undefined,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-density-page">
          <div className="mx-auto max-w-md text-center">
            {/* Error icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-danger-50 dark:bg-danger-900/20">
              <svg
                className="h-8 w-8 text-danger-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>

            {/* Title */}
            <h2 className="mb-2 text-xl font-semibold text-on">
              Something went wrong
            </h2>

            {/* Description */}
            <p className="mb-6 text-sm text-on-secondary">
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>

            {/* Error details (dev only) */}
            {import.meta.env.DEV && this.state.error && (
              <pre className="mb-6 max-h-32 overflow-auto rounded-lg bg-neutral-100 p-3 text-left text-xs text-danger-600 dark:bg-neutral-800 dark:text-danger-400">
                {this.state.error.message}
              </pre>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="inline-flex h-density-btn items-center gap-2 rounded-lg bg-primary px-density-btn text-sm font-medium text-primary-contrast transition-colors hover:bg-primary-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                </svg>
                Try again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="inline-flex h-density-btn items-center gap-2 rounded-lg border border-divider px-density-btn text-sm font-medium text-on-secondary transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
