/**
 * Tests for the RateLimiter service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RateLimiter, RateLimitError, withRateLimit } from '../../services/rateLimiter';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] || null),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
});

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic functionality', () => {
    it('creates with default config', () => {
      const limiter = new RateLimiter();
      expect(limiter.getTokens()).toBe(5); // Default maxTokens
    });

    it('creates with custom config', () => {
      const limiter = new RateLimiter({ maxTokens: 10 });
      expect(limiter.getTokens()).toBe(10);
    });

    it('allows requests within limit', () => {
      const limiter = new RateLimiter({ maxTokens: 3 });
      
      expect(limiter.tryConsume()).toBe(true);
      expect(limiter.tryConsume()).toBe(true);
      expect(limiter.tryConsume()).toBe(true);
      expect(limiter.getTokens()).toBe(0);
    });

    it('blocks requests when exhausted', () => {
      const limiter = new RateLimiter({ maxTokens: 2 });
      
      limiter.tryConsume();
      limiter.tryConsume();
      
      expect(limiter.tryConsume()).toBe(false);
    });
  });

  describe('Token refill', () => {
    it('refills tokens over time', () => {
      const limiter = new RateLimiter({
        maxTokens: 5,
        refillRate: 1, // 1 token per second
      });
      
      // Consume all tokens
      for (let i = 0; i < 5; i++) {
        limiter.tryConsume();
      }
      expect(limiter.getTokens()).toBe(0);
      
      // Advance time by 2 seconds
      vi.advanceTimersByTime(2000);
      
      expect(limiter.getTokens()).toBe(2);
    });

    it('does not exceed maxTokens', () => {
      const limiter = new RateLimiter({
        maxTokens: 5,
        refillRate: 10, // Fast refill
      });
      
      // Consume some tokens
      limiter.tryConsume();
      limiter.tryConsume();
      
      // Advance time significantly
      vi.advanceTimersByTime(60000);
      
      // Should cap at maxTokens
      expect(limiter.getTokens()).toBe(5);
    });
  });

  describe('Wait time calculation', () => {
    it('returns 0 when tokens available', () => {
      const limiter = new RateLimiter({ maxTokens: 5 });
      
      expect(limiter.getWaitTime()).toBe(0);
    });

    it('calculates wait time when exhausted', () => {
      const limiter = new RateLimiter({
        maxTokens: 1,
        refillRate: 0.1, // 1 token per 10 seconds
      });
      
      limiter.tryConsume();
      
      const waitTime = limiter.getWaitTime();
      // Should be around 10 seconds (10000ms)
      expect(waitTime).toBeGreaterThan(9000);
      expect(waitTime).toBeLessThanOrEqual(10000);
    });
  });

  describe('formatWaitTime', () => {
    it('returns empty string when tokens available', () => {
      const limiter = new RateLimiter({ maxTokens: 5 });
      
      expect(limiter.formatWaitTime()).toBe('');
    });

    it('formats seconds correctly', () => {
      const limiter = new RateLimiter({
        maxTokens: 1,
        refillRate: 0.2, // 1 token per 5 seconds
      });
      
      limiter.tryConsume();
      
      const formatted = limiter.formatWaitTime();
      expect(formatted).toMatch(/\d+ seconds?/);
    });

    it('formats minutes correctly', () => {
      const limiter = new RateLimiter({
        maxTokens: 1,
        refillRate: 1/120, // 1 token per 2 minutes
      });
      
      limiter.tryConsume();
      
      const formatted = limiter.formatWaitTime();
      expect(formatted).toMatch(/\d+ minutes?/);
    });

    it('handles singular form', () => {
      const limiter = new RateLimiter({
        maxTokens: 1,
        refillRate: 1, // 1 token per second
      });
      
      limiter.tryConsume();
      
      const formatted = limiter.formatWaitTime();
      expect(formatted).toBe('1 second');
    });
  });

  describe('Persistence', () => {
    it('saves state to localStorage', () => {
      const limiter = new RateLimiter({ maxTokens: 5 });
      limiter.tryConsume();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const calls = mockLocalStorage.setItem.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall).toBeDefined();
      expect(lastCall![0]).toBe('zenspace_rate_limit');
    });

    it('loads state from localStorage', () => {
      // Pre-populate localStorage
      mockLocalStorage.setItem('zenspace_rate_limit', JSON.stringify({
        tokens: 2,
        lastRefill: Date.now(),
      }));
      
      const limiter = new RateLimiter({ maxTokens: 5 });
      
      expect(limiter.getTokens()).toBe(2);
    });

    it('handles corrupted localStorage gracefully', () => {
      mockLocalStorage.setItem('zenspace_rate_limit', 'not valid json');
      
      // Should not throw
      const limiter = new RateLimiter({ maxTokens: 5 });
      expect(limiter.getTokens()).toBe(5);
    });

    it('handles missing localStorage data gracefully', () => {
      mockLocalStorage.setItem('zenspace_rate_limit', JSON.stringify({}));
      
      const limiter = new RateLimiter({ maxTokens: 5 });
      expect(limiter.getTokens()).toBe(5);
    });
  });

  describe('reset', () => {
    it('resets tokens to max', () => {
      const limiter = new RateLimiter({ maxTokens: 5 });
      
      limiter.tryConsume();
      limiter.tryConsume();
      limiter.tryConsume();
      expect(limiter.getTokens()).toBe(2);
      
      limiter.reset();
      expect(limiter.getTokens()).toBe(5);
    });
  });
});

describe('withRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockLocalStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes function when tokens available', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    
    const result = await withRateLimit(fn);
    
    expect(fn).toHaveBeenCalled();
    expect(result).toBe('result');
  });

  it('throws RateLimitError when exhausted', async () => {
    // Exhaust tokens first using the singleton
    const { rateLimiter } = await import('../../services/rateLimiter');
    rateLimiter.reset();
    
    // Consume all tokens
    for (let i = 0; i < 10; i++) {
      rateLimiter.tryConsume();
    }
    
    const fn = vi.fn().mockResolvedValue('result');
    
    await expect(withRateLimit(fn)).rejects.toThrow(RateLimitError);
    expect(fn).not.toHaveBeenCalled();
  });

  it('calls onRateLimited callback when exhausted', async () => {
    const { rateLimiter } = await import('../../services/rateLimiter');
    rateLimiter.reset();
    
    // Consume all tokens
    for (let i = 0; i < 10; i++) {
      rateLimiter.tryConsume();
    }
    
    const fn = vi.fn().mockResolvedValue('result');
    const onRateLimited = vi.fn();
    
    await expect(withRateLimit(fn, onRateLimited)).rejects.toThrow();
    expect(onRateLimited).toHaveBeenCalledWith(expect.any(String));
  });
});

describe('RateLimitError', () => {
  it('has correct name', () => {
    const error = new RateLimitError('Test error');
    expect(error.name).toBe('RateLimitError');
  });

  it('has correct message', () => {
    const error = new RateLimitError('Test error');
    expect(error.message).toBe('Test error');
  });

  it('includes wait time', () => {
    const error = new RateLimitError('Test error');
    expect(typeof error.waitTime).toBe('string');
  });

  it('is an instance of Error', () => {
    const error = new RateLimitError('Test error');
    expect(error).toBeInstanceOf(Error);
  });
});
