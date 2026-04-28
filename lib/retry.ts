import { isRetryable } from './errors';

type RetryOptions = {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;

      // If we've reached max attempts or the error is not retryable, throw immediately
      if (attempt >= maxAttempts || !isRetryable(error)) {
        throw error;
      }

      // Calculate delay with full jitter
      const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
      const capDelay = Math.min(maxDelay, exponentialDelay);
      const delay = Math.random() * capDelay;

      if (onRetry) {
        onRetry(error, attempt, delay);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Unreachable'); // TS compiler fallback
}
