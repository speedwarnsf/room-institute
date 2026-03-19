/**
 * Client-side rate limiter to prevent API abuse
 * Uses a token bucket algorithm with persistent storage
 */

export interface RateLimitConfig {
  maxTokens: number;           // Maximum tokens in the bucket
  refillRate: number;          // Tokens added per second
  refillInterval: number;      // Interval in ms to check refill
}

// Alias for backwards compatibility with tests
export type RateLimiterConfig = RateLimitConfig;

export interface RateLimitState {
  tokens: number;
  lastRefill: number;
  isLimited?: boolean;         // Optional: whether rate limit is active
}

const STORAGE_KEY = 'zenspace_rate_limit';

// Default config: 10 requests per minute with burst of 5
const DEFAULT_CONFIG: RateLimitConfig = {
  maxTokens: 5,
  refillRate: 10 / 60,  // 10 tokens per 60 seconds
  refillInterval: 1000,
};

/**
 * Rate limiter class for controlling API request frequency
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private state: RateLimitState;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.loadState();
    this.refill();
  }

  /**
   * Load state from localStorage
   */
  private loadState(): RateLimitState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          tokens: Math.min(parsed.tokens ?? this.config.maxTokens, this.config.maxTokens),
          lastRefill: parsed.lastRefill ?? Date.now(),
        };
      }
    } catch {
      // Ignore storage errors
    }
    return {
      tokens: this.config.maxTokens,
      lastRefill: Date.now(),
    };
  }

  /**
   * Persist state to localStorage
   */
  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.state.lastRefill) / 1000;
    const newTokens = elapsed * this.config.refillRate;
    
    this.state.tokens = Math.min(
      this.config.maxTokens,
      this.state.tokens + newTokens
    );
    this.state.lastRefill = now;
    this.saveState();
  }

  /**
   * Attempt to consume a token for a request
   * @returns true if request is allowed, false if rate limited
   */
  public tryConsume(): boolean {
    this.refill();
    
    if (this.state.tokens >= 1) {
      this.state.tokens -= 1;
      this.saveState();
      return true;
    }
    
    return false;
  }

  /**
   * Consume a specified number of tokens
   * @param amount - Number of tokens to consume
   * @returns true if tokens were consumed, false if insufficient tokens
   */
  public consume(amount: number = 1): boolean {
    this.refill();
    
    if (this.state.tokens >= amount) {
      this.state.tokens -= amount;
      this.saveState();
      return true;
    }
    
    return false;
  }

  /**
   * Get time until next token is available (in ms)
   */
  public getWaitTime(): number {
    this.refill();
    
    if (this.state.tokens >= 1) {
      return 0;
    }
    
    const tokensNeeded = 1 - this.state.tokens;
    return Math.ceil(tokensNeeded / this.config.refillRate * 1000);
  }

  /**
   * Get current token count
   */
  public getTokens(): number {
    this.refill();
    return Math.floor(this.state.tokens);
  }

  /**
   * Reset the rate limiter (for testing)
   */
  public reset(): void {
    this.state = {
      tokens: this.config.maxTokens,
      lastRefill: Date.now(),
    };
    this.saveState();
  }

  /**
   * Format wait time for user display
   */
  public formatWaitTime(): string {
    const waitMs = this.getWaitTime();
    if (waitMs <= 0) return '';
    
    const seconds = Math.ceil(waitMs / 1000);
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
}

// Singleton instance for the app
export const rateLimiter = new RateLimiter();

/**
 * Rate-limited wrapper for async functions
 */
export async function withRateLimit<T>(
  fn: () => Promise<T>,
  onRateLimited?: (waitTime: string) => void
): Promise<T> {
  if (!rateLimiter.tryConsume()) {
    const waitTime = rateLimiter.formatWaitTime();
    if (onRateLimited) {
      onRateLimited(waitTime);
    }
    throw new RateLimitError(`Rate limit exceeded. Please wait ${waitTime}.`);
  }
  
  return fn();
}

/**
 * Custom error for rate limiting
 */
export class RateLimitError extends Error {
  public readonly waitTime: string;
  
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
    this.waitTime = rateLimiter.formatWaitTime();
  }
}
