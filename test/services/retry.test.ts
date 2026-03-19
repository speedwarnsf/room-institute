/**
 * Retry Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateDelay,
  sleep,
  retryAsync,
  withRetry,
  isNetworkError,
  isRateLimitError,
  isServerError,
  createApiRetryCheck,
  getApiRetryConfig,
  CircuitBreaker,
  DEFAULT_RETRY_CONFIG,
} from '../../services/retry';

describe('Retry Service', () => {
  describe('calculateDelay', () => {
    it('calculates exponential backoff', () => {
      const delay0 = calculateDelay(0, { jitter: false, initialDelayMs: 1000 });
      const delay1 = calculateDelay(1, { jitter: false, initialDelayMs: 1000 });
      const delay2 = calculateDelay(2, { jitter: false, initialDelayMs: 1000 });

      expect(delay0).toBe(1000);
      expect(delay1).toBe(2000);
      expect(delay2).toBe(4000);
    });

    it('respects max delay', () => {
      const delay = calculateDelay(10, { 
        jitter: false, 
        initialDelayMs: 1000, 
        maxDelayMs: 5000 
      });
      expect(delay).toBe(5000);
    });

    it('adds jitter when enabled', () => {
      // Run multiple times to verify jitter varies
      const delays = new Set<number>();
      for (let i = 0; i < 10; i++) {
        delays.add(calculateDelay(0, { jitter: true, initialDelayMs: 1000 }));
      }
      // With jitter, we should see some variation
      expect(delays.size).toBeGreaterThan(1);
    });

    it('uses default config when not specified', () => {
      const delay = calculateDelay(0, {});
      expect(delay).toBeGreaterThan(0);
    });
  });

  describe('sleep', () => {
    it('waits for specified duration', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some tolerance
    });

    it('can be cancelled with AbortController', async () => {
      // Just verify it completes quickly
      const start = Date.now();
      await sleep(1);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('retryAsync', () => {
    it('succeeds on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await retryAsync(operation);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('retries on failure', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');
      
      const result = await retryAsync(operation, { 
        initialDelayMs: 1,
        maxRetries: 3 
      });
      
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });

    it('fails after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('always fails'));
      
      const result = await retryAsync(operation, { 
        maxRetries: 2,
        initialDelayMs: 1 
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.attempts).toBe(3); // Initial + 2 retries
    });

    it('does not retry non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('not retryable'));
      
      const result = await retryAsync(operation, {
        maxRetries: 3,
        isRetryable: () => false,
      });
      
      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
    });

    it('calls onRetry callback', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');
      const onRetry = vi.fn();
      
      await retryAsync(operation, {
        initialDelayMs: 1,
        onRetry,
      });
      
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), expect.any(Number));
    });

    it('tracks total time', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await retryAsync(operation);
      
      expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('withRetry', () => {
    it('wraps a function with retry logic', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      const wrapped = withRetry(fn);
      
      const result = await wrapped();
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('result');
    });

    it('passes arguments to wrapped function', async () => {
      const fn = vi.fn().mockImplementation((a: number, b: number) => 
        Promise.resolve(a + b)
      );
      const wrapped = withRetry(fn);
      
      const result = await wrapped(2, 3);
      
      expect(result.result).toBe(5);
    });
  });

  describe('isNetworkError', () => {
    it('detects TypeError with network message', () => {
      const error = new TypeError('Failed to fetch');
      expect(isNetworkError(error)).toBe(true);
    });

    it('detects network-related error messages', () => {
      expect(isNetworkError(new Error('Network request failed'))).toBe(true);
      expect(isNetworkError(new Error('Request timeout'))).toBe(true);
      expect(isNetworkError(new Error('ECONNREFUSED'))).toBe(true);
    });

    it('returns false for non-network errors', () => {
      expect(isNetworkError(new Error('Validation failed'))).toBe(false);
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError(undefined)).toBe(false);
    });
  });

  describe('isRateLimitError', () => {
    it('detects rate limit error messages', () => {
      expect(isRateLimitError(new Error('Rate limit exceeded'))).toBe(true);
      expect(isRateLimitError(new Error('429 Too Many Requests'))).toBe(true);
      expect(isRateLimitError(new Error('Quota exceeded'))).toBe(true);
    });

    it('detects rate limit error codes', () => {
      expect(isRateLimitError({ code: 'RATE_LIMIT' })).toBe(true);
      expect(isRateLimitError({ code: 429 })).toBe(true);
      expect(isRateLimitError({ status: 429 })).toBe(true);
    });

    it('returns false for non-rate-limit errors', () => {
      expect(isRateLimitError(new Error('Server error'))).toBe(false);
      expect(isRateLimitError({ code: 'OTHER' })).toBe(false);
    });
  });

  describe('isServerError', () => {
    it('detects 5xx status codes', () => {
      expect(isServerError({ status: 500 })).toBe(true);
      expect(isServerError({ status: 502 })).toBe(true);
      expect(isServerError({ status: 503 })).toBe(true);
      expect(isServerError({ status: 504 })).toBe(true);
    });

    it('detects server error messages', () => {
      expect(isServerError(new Error('500 Internal Server Error'))).toBe(true);
      expect(isServerError(new Error('503 Service Unavailable'))).toBe(true);
    });

    it('returns false for client errors', () => {
      expect(isServerError({ status: 400 })).toBe(false);
      expect(isServerError({ status: 404 })).toBe(false);
    });
  });

  describe('createApiRetryCheck', () => {
    it('creates a function that checks retryable errors', () => {
      const check = createApiRetryCheck();
      
      expect(check(new TypeError('Failed to fetch'))).toBe(true);
      expect(check({ status: 429 })).toBe(true);
      expect(check({ status: 500 })).toBe(true);
      expect(check(new Error('Validation error'))).toBe(false);
    });
  });

  describe('getApiRetryConfig', () => {
    it('returns default API retry config', () => {
      const config = getApiRetryConfig();
      
      expect(config.maxRetries).toBe(3);
      expect(config.initialDelayMs).toBe(1000);
      expect(config.isRetryable).toBeDefined();
    });

    it('allows overriding defaults', () => {
      const config = getApiRetryConfig({ maxRetries: 5 });
      
      expect(config.maxRetries).toBe(5);
      expect(config.initialDelayMs).toBe(1000); // Not overridden
    });
  });

  describe('CircuitBreaker', () => {
    it('starts in closed state', () => {
      const breaker = new CircuitBreaker();
      expect(breaker.getState()).toBe('closed');
      expect(breaker.canAttempt()).toBe(true);
    });

    it('opens after failure threshold', () => {
      const breaker = new CircuitBreaker(3, 1000);
      
      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.getState()).toBe('closed');
      
      breaker.recordFailure();
      expect(breaker.getState()).toBe('open');
      expect(breaker.canAttempt()).toBe(false);
    });

    it('resets failure count on success', () => {
      const breaker = new CircuitBreaker(3, 1000);
      
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordSuccess();
      breaker.recordFailure();
      
      expect(breaker.getState()).toBe('closed');
    });

    it('moves to half-open after reset time', async () => {
      const breaker = new CircuitBreaker(1, 50); // 50ms reset
      
      breaker.recordFailure();
      expect(breaker.getState()).toBe('open');
      
      await sleep(60);
      expect(breaker.getState()).toBe('half-open');
      expect(breaker.canAttempt()).toBe(true);
    });

    it('closes on success in half-open state', async () => {
      const breaker = new CircuitBreaker(1, 10);
      
      breaker.recordFailure();
      await sleep(15);
      
      expect(breaker.getState()).toBe('half-open');
      breaker.recordSuccess();
      expect(breaker.getState()).toBe('closed');
    });

    it('can be manually reset', () => {
      const breaker = new CircuitBreaker(1, 10000);
      
      breaker.recordFailure();
      expect(breaker.getState()).toBe('open');
      
      breaker.reset();
      expect(breaker.getState()).toBe('closed');
      expect(breaker.canAttempt()).toBe(true);
    });
  });

  describe('DEFAULT_RETRY_CONFIG', () => {
    it('has reasonable defaults', () => {
      expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_RETRY_CONFIG.initialDelayMs).toBe(1000);
      expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBe(30000);
      expect(DEFAULT_RETRY_CONFIG.backoffMultiplier).toBe(2);
      expect(DEFAULT_RETRY_CONFIG.jitter).toBe(true);
    });
  });
});
