/**
 * Retries an operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const backoffDelay = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  throw lastError;
}

/**
 * Enhanced network error detection
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('offline') ||
      errorMessage.includes('failed to fetch') ||
      errorMessage.includes('network request failed') ||
      errorMessage.includes('connection refused') ||
      errorMessage.includes('no internet connection') ||
      errorMessage.includes('network error') ||
      errorMessage.includes('cors') ||
      errorMessage.includes('cross-origin')
    );
  }
  return false;
}

/**
 * Get a user-friendly error message for network errors
 */
export function getNetworkErrorMessage(error: unknown): string {
  if (!isNetworkError(error)) {
    return 'An unexpected error occurred';
  }

  const errorMessage = (error as Error).message.toLowerCase();
  
  if (errorMessage.includes('timeout')) {
    return 'The request timed out. Please check your connection and try again.';
  }
  
  if (errorMessage.includes('offline') || errorMessage.includes('no internet')) {
    return 'You appear to be offline. Please check your internet connection.';
  }
  
  if (errorMessage.includes('cors') || errorMessage.includes('cross-origin')) {
    return 'Unable to connect to the server. Please try again later.';
  }
  
  return 'Network error. Please check your connection and try again.';
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
} 