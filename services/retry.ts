/**
 * Retry Utilities for ZenSpace
 * 
 * Provides robust retry logic for API calls and other operations
 */

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelayMs?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Add random jitter to delay (default: true) */
  jitter?: boolean;
  /** Function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;
  /** Callback when retry is attempted */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: unknown;
  attempts: number;
  totalTimeMs: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: Required<Omit<RetryConfig, 'onRetry'>> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
  isRetryable: () => true,
};

/**
 * Calculate delay for a retry attempt with exponential backoff
 */
export function calculateDelay(
  attempt: number,
  config: RetryConfig = {}
): number {
  const {
    initialDelayMs = DEFAULT_RETRY_CONFIG.initialDelayMs,
    maxDelayMs = DEFAULT_RETRY_CONFIG.maxDelayMs,
    backoffMultiplier = DEFAULT_RETRY_CONFIG.backoffMultiplier,
    jitter = DEFAULT_RETRY_CONFIG.jitter,
  } = config;

  // Exponential backoff: delay = initial * multiplier^attempt
  let delay = initialDelayMs * Math.pow(backoffMultiplier, attempt);
  
  // Cap at max delay
  delay = Math.min(delay, maxDelayMs);
  
  // Add jitter (±25% of delay)
  if (jitter) {
    const jitterFactor = 0.75 + Math.random() * 0.5; // 0.75 to 1.25
    delay = Math.round(delay * jitterFactor);
  }
  
  return delay;
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryAsync<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = DEFAULT_RETRY_CONFIG.maxRetries,
    isRetryable = DEFAULT_RETRY_CONFIG.isRetryable,
    onRetry,
  } = config;

  const startTime = performance.now();
  let lastError: unknown;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const result = await operation();
      return {
        success: true,
        result,
        attempts: attempt + 1,
        totalTimeMs: performance.now() - startTime,
      };
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt >= maxRetries || !isRetryable(error)) {
        break;
      }
      
      // Calculate delay and wait
      const delay = calculateDelay(attempt, config);
      
      if (onRetry) {
        onRetry(attempt + 1, error, delay);
      }
      
      await sleep(delay);
      attempt++;
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: attempt + 1,
    totalTimeMs: performance.now() - startTime,
  };
}

/**
 * Create a function that retries with the given config
 */
export function withRetry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  config: RetryConfig = {}
): (...args: Parameters<T>) => Promise<RetryResult<Awaited<ReturnType<T>>>> {
  return async (...args: Parameters<T>) => {
    return retryAsync(() => fn(...args) as Promise<Awaited<ReturnType<T>>>, config);
  };
}

/**
 * Check if an error is a network error (usually retryable)
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('failed to fetch')
    );
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    );
  }
  
  return false;
}

/**
 * Check if an error is a rate limit error (usually retryable after delay)
 */
export function isRateLimitError(error: unknown): boolean {
  if (!error) return false;
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('quota') ||
      message.includes('too many requests') ||
      message.includes('429')
    );
  }
  
  // Check for custom error objects
  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, unknown>;
    if (obj.code === 'RATE_LIMIT' || obj.code === 429) {
      return true;
    }
    if (obj.status === 429) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if an error is a server error (usually retryable)
 */
export function isServerError(error: unknown): boolean {
  if (!error) return false;
  
  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, unknown>;
    const status = obj.status as number | undefined;
    if (status && status >= 500 && status < 600) {
      return true;
    }
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504') ||
      message.includes('internal server error') ||
      message.includes('service unavailable')
    );
  }
  
  return false;
}

/**
 * Create a standard retryable check for API errors
 */
export function createApiRetryCheck(): (error: unknown) => boolean {
  return (error: unknown) => {
    return isNetworkError(error) || isRateLimitError(error) || isServerError(error);
  };
}

/**
 * Get retry configuration for API calls
 */
export function getApiRetryConfig(overrides: Partial<RetryConfig> = {}): RetryConfig {
  return {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitter: true,
    isRetryable: createApiRetryCheck(),
    ...overrides,
  };
}

/**
 * Circuit breaker state
 */
type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Simple circuit breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  
  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeMs: number = 30000
  ) {}

  getState(): CircuitState {
    if (this.state === 'open') {
      // Check if we should move to half-open
      if (Date.now() - this.lastFailureTime > this.resetTimeMs) {
        this.state = 'half-open';
      }
    }
    return this.state;
  }

  canAttempt(): boolean {
    const state = this.getState();
    return state === 'closed' || state === 'half-open';
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}
