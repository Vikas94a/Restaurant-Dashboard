import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ErrorState {
  error: Error | null;
  isError: boolean;
  retryCount: number;
}

export function useErrorHandler(maxRetries = 3) {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    retryCount: 0,
  });

  const handleError = useCallback((error: Error, operation: string) => {
    setErrorState(prev => ({
      error,
      isError: true,
      retryCount: prev.retryCount + 1,
    }));

    // Show user-friendly error message
    toast.error(
      `Failed to ${operation}. ${errorState.retryCount < maxRetries ? 'Retrying...' : 'Please try again later.'}`,
      {
        duration: 5000,
      }
    );
  }, [maxRetries, errorState.retryCount]);

  const resetError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      retryCount: 0,
    });
  }, []);

  const canRetry = errorState.retryCount < maxRetries;

  return {
    error: errorState.error,
    isError: errorState.isError,
    retryCount: errorState.retryCount,
    handleError,
    resetError,
    canRetry,
  };
} 