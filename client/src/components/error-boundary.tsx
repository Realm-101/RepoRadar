import * as React from 'react';
import { Component, ReactNode } from 'react';
import { AppError } from '@/../../shared/errors';
import { errorHandler } from '@/lib/error-handler';
import { ErrorMessage } from './error-message';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AppError, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

/**
 * Error boundary component that catches React errors and provides recovery UI
 * 
 * @example
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * 
 * @example
 * <ErrorBoundary
 *   fallback={(error, retry) => (
 *     <CustomErrorUI error={error} onRetry={retry} />
 *   )}
 *   onError={(error, errorInfo) => {
 *     // Log to error tracking service
 *   }}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Convert error to AppError
    const appError = errorHandler.handle(error);

    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full">
            <ErrorMessage
              error={this.state.error}
              onRetry={this.handleRetry}
              severity="error"
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
