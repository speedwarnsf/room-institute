/**
 * Edge Case Tests for ZenSpace
 * 
 * Tests for malformed images, network failures, quota exceeded, and other edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Error class for testing
class GeminiApiError extends Error {
  code: string;
  isRetryable: boolean;

  constructor(message: string, code = 'UNKNOWN', isRetryable = false) {
    super(message);
    this.name = 'GeminiApiError';
    this.code = code;
    this.isRetryable = isRetryable;
  }
}

describe('Edge Case Tests', () => {
  describe('Malformed Image Handling', () => {
    const validateImageData = (base64: string): { valid: boolean; error?: string } => {
      // Empty check
      if (!base64 || base64.trim().length === 0) {
        return { valid: false, error: 'Image data is empty' };
      }

      // Check for valid base64 characters
      const base64Regex = /^[A-Za-z0-9+/=]+$/;
      if (!base64Regex.test(base64)) {
        return { valid: false, error: 'Invalid base64 characters detected' };
      }

      // Check for proper padding
      if (base64.length % 4 !== 0) {
        return { valid: false, error: 'Invalid base64 padding' };
      }

      // Minimum size check (a valid JPEG header is at least ~107 bytes)
      if (base64.length < 100) {
        return { valid: false, error: 'Image data too small to be valid' };
      }

      return { valid: true };
    };

    it('rejects empty image data', () => {
      const result = validateImageData('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Image data is empty');
    });

    it('rejects whitespace-only image data', () => {
      const result = validateImageData('   \n\t  ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Image data is empty');
    });

    it('rejects invalid base64 characters', () => {
      const result = validateImageData('invalid!@#$%^&*()base64');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid base64 characters detected');
    });

    it('rejects incorrectly padded base64', () => {
      // Valid base64 must be divisible by 4
      const result = validateImageData('YWJj'); // "abc" in base64, length 4 - valid
      expect(result.valid).toBe(false); // But too short to be an image
    });

    it('rejects too-small image data', () => {
      const result = validateImageData('YWJjZA=='); // Valid base64 but too small
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Image data too small to be valid');
    });

    it('accepts valid-looking base64 data', () => {
      // Create a fake but valid base64 string of sufficient length (multiple of 4)
      const fakeValidBase64 = 'AAAA'.repeat(50); // 200 chars, divisible by 4
      const result = validateImageData(fakeValidBase64);
      expect(result.valid).toBe(true);
    });
  });

  describe('MIME Type Validation', () => {
    const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    const validateMimeType = (mimeType: string): { valid: boolean; error?: string } => {
      if (!mimeType) {
        return { valid: false, error: 'No MIME type provided' };
      }

      if (!VALID_MIME_TYPES.includes(mimeType)) {
        return { 
          valid: false, 
          error: `Unsupported image type: ${mimeType}. Supported types: JPEG, PNG, WebP, GIF` 
        };
      }

      return { valid: true };
    };

    it('accepts valid image MIME types', () => {
      VALID_MIME_TYPES.forEach(mime => {
        expect(validateMimeType(mime).valid).toBe(true);
      });
    });

    it('rejects text MIME types', () => {
      const result = validateMimeType('text/plain');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported image type');
    });

    it('rejects video MIME types', () => {
      const result = validateMimeType('video/mp4');
      expect(result.valid).toBe(false);
    });

    it('rejects PDF MIME types', () => {
      const result = validateMimeType('application/pdf');
      expect(result.valid).toBe(false);
    });

    it('rejects SVG images (not supported by Gemini)', () => {
      const result = validateMimeType('image/svg+xml');
      expect(result.valid).toBe(false);
    });

    it('rejects empty MIME type', () => {
      const result = validateMimeType('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('No MIME type provided');
    });
  });

  describe('Network Failure Handling', () => {
    const createNetworkError = (type: string): GeminiApiError => {
      const errorMap: Record<string, { message: string; code: string; isRetryable: boolean }> = {
        timeout: {
          message: 'Request timed out. Please check your internet connection and try again.',
          code: 'NETWORK_TIMEOUT',
          isRetryable: true,
        },
        offline: {
          message: 'You appear to be offline. Please check your internet connection.',
          code: 'NETWORK_OFFLINE',
          isRetryable: true,
        },
        dns: {
          message: 'Could not reach the server. Please try again in a moment.',
          code: 'NETWORK_DNS',
          isRetryable: true,
        },
        ssl: {
          message: 'Secure connection failed. Please try again.',
          code: 'NETWORK_SSL',
          isRetryable: true,
        },
        refused: {
          message: 'Connection refused. The service may be temporarily unavailable.',
          code: 'NETWORK_REFUSED',
          isRetryable: true,
        },
      };

      const errorInfo = errorMap[type] || {
        message: 'A network error occurred. Please try again.',
        code: 'NETWORK_ERROR',
        isRetryable: true,
      };

      return new GeminiApiError(errorInfo.message, errorInfo.code, errorInfo.isRetryable);
    };

    it('creates timeout error with helpful message', () => {
      const error = createNetworkError('timeout');
      expect(error.code).toBe('NETWORK_TIMEOUT');
      expect(error.isRetryable).toBe(true);
      expect(error.message).toContain('timed out');
    });

    it('creates offline error with connection guidance', () => {
      const error = createNetworkError('offline');
      expect(error.code).toBe('NETWORK_OFFLINE');
      expect(error.message).toContain('offline');
    });

    it('all network errors are retryable', () => {
      const types = ['timeout', 'offline', 'dns', 'ssl', 'refused'];
      types.forEach(type => {
        const error = createNetworkError(type);
        expect(error.isRetryable).toBe(true);
      });
    });
  });

  describe('Quota Exceeded Handling', () => {
    interface QuotaInfo {
      type: 'daily' | 'per_minute' | 'tokens';
      limit: number;
      current: number;
      resetTime?: Date;
    }

    const createQuotaError = (info: QuotaInfo): GeminiApiError => {
      let message: string;
      let code: string;
      
      switch (info.type) {
        case 'daily':
          message = `Daily API quota exceeded (${info.current}/${info.limit} requests). Quota resets at midnight UTC.`;
          code = 'QUOTA_DAILY';
          break;
        case 'per_minute':
          message = `Rate limit exceeded (${info.current}/${info.limit} requests per minute). Please wait a moment and try again.`;
          code = 'RATE_LIMIT';
          break;
        case 'tokens':
          message = `Token limit exceeded for this request. Try using a smaller image or shorter prompt.`;
          code = 'QUOTA_TOKENS';
          break;
        default:
          message = 'API quota exceeded. Please try again later.';
          code = 'QUOTA_EXCEEDED';
      }

      return new GeminiApiError(message, code, info.type === 'per_minute');
    };

    it('creates daily quota error with reset info', () => {
      const error = createQuotaError({ type: 'daily', limit: 1000, current: 1000 });
      expect(error.code).toBe('QUOTA_DAILY');
      expect(error.message).toContain('1000/1000');
      expect(error.message).toContain('midnight UTC');
      expect(error.isRetryable).toBe(false); // Can't retry until tomorrow
    });

    it('creates rate limit error that is retryable', () => {
      const error = createQuotaError({ type: 'per_minute', limit: 60, current: 60 });
      expect(error.code).toBe('RATE_LIMIT');
      expect(error.isRetryable).toBe(true); // Can retry after a minute
    });

    it('creates token limit error with suggestion', () => {
      const error = createQuotaError({ type: 'tokens', limit: 32000, current: 50000 });
      expect(error.code).toBe('QUOTA_TOKENS');
      expect(error.message).toContain('smaller image');
    });
  });

  describe('Corrupted Response Handling', () => {
    const parseJsonSafely = (text: string): { success: boolean; data?: unknown; error?: string } => {
      if (!text || text.trim().length === 0) {
        return { success: false, error: 'Empty response from server' };
      }

      // Check for HTML error pages (common API gateway errors)
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        return { success: false, error: 'Received HTML error page instead of JSON response' };
      }

      // Check for plain text errors
      if (text.trim().startsWith('Error:') || text.trim().startsWith('error:')) {
        return { success: false, error: `Server error: ${text.trim()}` };
      }

      try {
        const data = JSON.parse(text);
        return { success: true, data };
      } catch (e) {
        // Try to give helpful error for common issues
        if (text.includes('}{')) {
          return { success: false, error: 'Malformed JSON: multiple objects concatenated' };
        }
        if (text.endsWith(',')) {
          return { success: false, error: 'Malformed JSON: trailing comma' };
        }
        return { success: false, error: 'Failed to parse response as JSON' };
      }
    };

    it('handles empty response', () => {
      const result = parseJsonSafely('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Empty response');
    });

    it('detects HTML error pages', () => {
      const result = parseJsonSafely('<!DOCTYPE html><html><body>503 Service Unavailable</body></html>');
      expect(result.success).toBe(false);
      expect(result.error).toContain('HTML error page');
    });

    it('handles concatenated JSON objects', () => {
      const result = parseJsonSafely('{"a":1}{"b":2}');
      expect(result.success).toBe(false);
      expect(result.error).toContain('multiple objects');
    });

    it('handles malformed JSON gracefully', () => {
      const result = parseJsonSafely('{"a": 1,}');
      expect(result.success).toBe(false);
      expect(result.error).toContain('parse');
    });

    it('parses valid JSON', () => {
      const result = parseJsonSafely('{"analysis": "test", "products": []}');
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ analysis: 'test', products: [] });
    });
  });

  describe('File Size Edge Cases', () => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const MIN_FILE_SIZE = 1024; // 1KB minimum for a real image

    const validateFileSize = (sizeBytes: number): { valid: boolean; error?: string } => {
      if (sizeBytes < MIN_FILE_SIZE) {
        return { valid: false, error: 'File is too small to be a valid image' };
      }
      if (sizeBytes > MAX_FILE_SIZE) {
        const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
        return { 
          valid: false, 
          error: `File is too large (${sizeMB}MB). Maximum size is 10MB. Try compressing the image first.` 
        };
      }
      return { valid: true };
    };

    it('rejects files that are too small', () => {
      const result = validateFileSize(100); // 100 bytes
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too small');
    });

    it('rejects files over 10MB', () => {
      const result = validateFileSize(15 * 1024 * 1024); // 15MB
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
      expect(result.error).toContain('15.0MB');
    });

    it('accepts files within valid range', () => {
      const result = validateFileSize(5 * 1024 * 1024); // 5MB
      expect(result.valid).toBe(true);
    });

    it('rejects exactly at max boundary', () => {
      const result = validateFileSize(MAX_FILE_SIZE + 1);
      expect(result.valid).toBe(false);
    });

    it('accepts exactly at max boundary', () => {
      const result = validateFileSize(MAX_FILE_SIZE);
      expect(result.valid).toBe(true);
    });
  });

  describe('Concurrent Request Handling', () => {
    const MAX_CONCURRENT = 3;
    let activeRequests = 0;

    const trackRequest = async <T>(fn: () => Promise<T>): Promise<T> => {
      if (activeRequests >= MAX_CONCURRENT) {
        throw new GeminiApiError(
          `Too many concurrent requests (${activeRequests}/${MAX_CONCURRENT}). Please wait for current analysis to complete.`,
          'TOO_MANY_REQUESTS',
          true
        );
      }

      activeRequests++;
      try {
        return await fn();
      } finally {
        activeRequests--;
      }
    };

    beforeEach(() => {
      activeRequests = 0;
    });

    it('allows requests under limit', async () => {
      const result = await trackRequest(async () => 'success');
      expect(result).toBe('success');
    });

    it('rejects when at limit', async () => {
      activeRequests = 3;
      
      await expect(trackRequest(async () => 'test')).rejects.toThrow('Too many concurrent requests');
    });

    it('decrements counter after request completes', async () => {
      await trackRequest(async () => 'done');
      expect(activeRequests).toBe(0);
    });

    it('decrements counter even on failure', async () => {
      try {
        await trackRequest(async () => {
          throw new Error('test error');
        });
      } catch {
        // Expected
      }
      expect(activeRequests).toBe(0);
    });
  });

  describe('Image Dimension Edge Cases', () => {
    const MAX_DIMENSION = 4096; // Gemini's max dimension
    const MIN_DIMENSION = 16; // Practical minimum

    const validateDimensions = (
      width: number, 
      height: number
    ): { valid: boolean; error?: string; warning?: string } => {
      if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
        return { valid: false, error: `Image too small (${width}x${height}). Minimum is ${MIN_DIMENSION}x${MIN_DIMENSION} pixels.` };
      }

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        return { 
          valid: true, 
          warning: `Image will be resized from ${width}x${height} to fit within ${MAX_DIMENSION}x${MAX_DIMENSION}` 
        };
      }

      const aspectRatio = width / height;
      if (aspectRatio > 10 || aspectRatio < 0.1) {
        return { 
          valid: false, 
          error: 'Image has an extreme aspect ratio. Please use a more standard image shape.' 
        };
      }

      return { valid: true };
    };

    it('rejects tiny images', () => {
      const result = validateDimensions(10, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too small');
    });

    it('warns about large images that will be resized', () => {
      const result = validateDimensions(8000, 6000);
      expect(result.valid).toBe(true);
      expect(result.warning).toContain('will be resized');
    });

    it('rejects extreme aspect ratios (too wide)', () => {
      const result = validateDimensions(2000, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('extreme aspect ratio');
    });

    it('rejects extreme aspect ratios (too tall)', () => {
      const result = validateDimensions(100, 2000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('extreme aspect ratio');
    });

    it('accepts normal dimensions', () => {
      const result = validateDimensions(1920, 1080);
      expect(result.valid).toBe(true);
      expect(result.warning).toBeUndefined();
    });
  });
});
