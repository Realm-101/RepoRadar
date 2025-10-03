import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../error-boundary';
import { AppError } from '@/../../shared/errors';
import { afterEach } from 'node:test';
import { beforeEach } from 'node:test';

// Component that throws an error
const ThrowError = ({ error }: { error: Error }) => {
  throw error;
};

// Component that works normally
const WorkingComponent = () => <div>Working component</div>;

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Working component')).toBeInTheDocument();
  });

  it('should catch errors and display error UI', () => {
    const error = new Error('Test error');

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    // Should display error message
    expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();
  });

  it('should convert Error to AppError', () => {
    const error = new Error('Test error');

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    // Should display user-friendly message
    expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();
  });

  it('should display AppError correctly', () => {
    const error = new AppError(
      'TEST_ERROR',
      'Internal message',
      'Custom user message',
      500
    );

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom user message')).toBeInTheDocument();
  });

  it('should render retry button', () => {
    const error = new Error('Test error');

    render(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('should reset error state when retry is clicked', async () => {
    const user = userEvent.setup();
    let shouldThrow = true;

    const ConditionalThrow = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Success</div>;
    };

    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    // Error should be displayed
    expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();

    // Fix the error condition
    shouldThrow = false;

    // Click retry
    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    // Should render successfully now
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn();
    const error = new Error('Test error');

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(error, expect.any(Object));
  });

  it('should use custom fallback when provided', () => {
    const error = new Error('Test error');
    const fallback = (error: AppError, retry: () => void) => (
      <div>
        <p>Custom error UI</p>
        <p>{error.userMessage}</p>
        <button onClick={retry}>Custom Retry</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /custom retry/i })).toBeInTheDocument();
  });

  it('should pass retry function to custom fallback', async () => {
    const user = userEvent.setup();
    let shouldThrow = true;

    const ConditionalThrow = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Success</div>;
    };

    const fallback = (error: AppError, retry: () => void) => (
      <div>
        <p>Error occurred</p>
        <button onClick={retry}>Retry</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={fallback}>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    // Fix the error
    shouldThrow = false;

    // Click retry
    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    // Should render successfully
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('should handle multiple errors', async () => {
    const user = userEvent.setup();
    let errorCount = 0;

    const MultipleErrors = () => {
      errorCount++;
      if (errorCount <= 2) {
        throw new Error(`Error ${errorCount}`);
      }
      return <div>Success</div>;
    };

    render(
      <ErrorBoundary>
        <MultipleErrors />
      </ErrorBoundary>
    );

    // First error
    expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();

    // Retry - second error
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();

    // Retry - success
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
