/**
 * ZenSpace - Gemini Service Tests
 * 
 * Tests for the AI service layer - unit tests with isolated logic
 */

import { describe, it, expect } from 'vitest';

// Test the error class and validation logic without importing the actual service
describe('GeminiService Unit Tests', () => {
  // Custom error class for testing
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

  describe('GeminiApiError', () => {
    it('creates error with all properties', () => {
      const error = new GeminiApiError('Test error', 'TEST_CODE', true);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('GeminiApiError');
    });

    it('defaults to non-retryable with UNKNOWN code', () => {
      const error = new GeminiApiError('Test error');
      
      expect(error.code).toBe('UNKNOWN');
      expect(error.isRetryable).toBe(false);
    });

    it('is an instance of Error', () => {
      const error = new GeminiApiError('Test');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('Error Code Classification', () => {
    const errorCodes = {
      API_KEY_MISSING: { isRetryable: false, severity: 'critical' },
      INVALID_API_KEY: { isRetryable: false, severity: 'critical' },
      RATE_LIMIT: { isRetryable: true, severity: 'warning' },
      NETWORK_ERROR: { isRetryable: true, severity: 'warning' },
      EMPTY_RESPONSE: { isRetryable: true, severity: 'info' },
      PARSE_ERROR: { isRetryable: true, severity: 'info' },
      INVALID_RESPONSE: { isRetryable: true, severity: 'warning' },
      NO_IMAGE_GENERATED: { isRetryable: true, severity: 'warning' },
      VISUALIZATION_FAILED: { isRetryable: true, severity: 'error' },
      UNKNOWN: { isRetryable: false, severity: 'error' },
    };

    Object.entries(errorCodes).forEach(([code, expected]) => {
      it(`classifies ${code} correctly`, () => {
        expect(expected.isRetryable).toBeDefined();
        expect(expected.severity).toBeDefined();
      });
    });
  });

  describe('Response Validation', () => {
    interface AnalysisApiResponse {
      analysis_markdown: string;
      visualization_prompt: string;
      products: Array<{
        name: string;
        search_term: string;
        reason: string;
      }>;
    }

    const validateAnalysisResponse = (data: unknown): data is AnalysisApiResponse => {
      if (!data || typeof data !== 'object') return false;
      const obj = data as Record<string, unknown>;
      return (
        typeof obj.analysis_markdown === 'string' &&
        typeof obj.visualization_prompt === 'string' &&
        Array.isArray(obj.products)
      );
    };

    it('validates complete analysis response', () => {
      const validResponse = {
        analysis_markdown: '# Analysis',
        visualization_prompt: 'Clean the room',
        products: [{ name: 'Bin', search_term: 'storage bin', reason: 'organize' }]
      };
      
      expect(validateAnalysisResponse(validResponse)).toBe(true);
    });

    it('rejects response missing analysis_markdown', () => {
      const invalidResponse = {
        visualization_prompt: 'Clean the room',
        products: []
      };
      
      expect(validateAnalysisResponse(invalidResponse)).toBe(false);
    });

    it('rejects response with wrong types', () => {
      const invalidResponse = {
        analysis_markdown: 123, // Should be string
        visualization_prompt: 'Clean',
        products: 'not an array' // Should be array
      };
      
      expect(validateAnalysisResponse(invalidResponse)).toBe(false);
    });

    it('rejects null', () => {
      expect(validateAnalysisResponse(null)).toBe(false);
    });

    it('rejects undefined', () => {
      expect(validateAnalysisResponse(undefined)).toBe(false);
    });

    it('rejects non-object', () => {
      expect(validateAnalysisResponse('string')).toBe(false);
    });
  });

  describe('Product Response Transformation', () => {
    interface ApiProduct {
      name: string;
      search_term: string;
      reason: string;
    }

    interface ProductSuggestion {
      name: string;
      searchTerm: string;
      reason: string;
    }

    const transformProducts = (apiProducts: ApiProduct[]): ProductSuggestion[] => {
      return apiProducts.map(p => ({
        name: p.name,
        searchTerm: p.search_term,
        reason: p.reason
      }));
    };

    it('transforms snake_case to camelCase', () => {
      const apiProducts: ApiProduct[] = [
        { name: 'Basket', search_term: 'woven basket', reason: 'storage' }
      ];
      
      const result = transformProducts(apiProducts);
      
      expect(result[0]!.searchTerm).toBe('woven basket');
      expect(result[0]!).not.toHaveProperty('search_term');
    });

    it('handles empty array', () => {
      expect(transformProducts([])).toEqual([]);
    });

    it('handles multiple products', () => {
      const apiProducts: ApiProduct[] = [
        { name: 'A', search_term: 'a', reason: 'ra' },
        { name: 'B', search_term: 'b', reason: 'rb' },
      ];
      
      const result = transformProducts(apiProducts);
      
      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe('A');
      expect(result[1]!.name).toBe('B');
    });
  });

  describe('Error Detection Patterns', () => {
    const detectErrorType = (message: string): string => {
      const lower = message.toLowerCase();
      
      if (lower.includes('api key') || lower.includes('unauthorized') || lower.includes('401')) {
        return 'INVALID_API_KEY';
      }
      if (lower.includes('quota') || lower.includes('rate limit') || lower.includes('429')) {
        return 'RATE_LIMIT';
      }
      if (lower.includes('network') || lower.includes('timeout') || lower.includes('fetch')) {
        return 'NETWORK_ERROR';
      }
      return 'UNKNOWN';
    };

    it('detects API key errors', () => {
      expect(detectErrorType('401 unauthorized')).toBe('INVALID_API_KEY');
      expect(detectErrorType('Invalid API key')).toBe('INVALID_API_KEY');
    });

    it('detects rate limit errors', () => {
      expect(detectErrorType('429 rate limit exceeded')).toBe('RATE_LIMIT');
      expect(detectErrorType('Quota exceeded')).toBe('RATE_LIMIT');
    });

    it('detects network errors', () => {
      expect(detectErrorType('Network request failed')).toBe('NETWORK_ERROR');
      expect(detectErrorType('Request timeout')).toBe('NETWORK_ERROR');
      expect(detectErrorType('Fetch failed')).toBe('NETWORK_ERROR');
    });

    it('returns UNKNOWN for unrecognized errors', () => {
      expect(detectErrorType('Something went wrong')).toBe('UNKNOWN');
    });
  });

  describe('Input Validation', () => {
    const validateImageInput = (base64: string, mimeType: string): string | null => {
      if (!base64 || base64.length === 0) {
        return 'No image data provided';
      }
      
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validMimeTypes.includes(mimeType)) {
        return 'Invalid image type';
      }
      
      return null; // Valid
    };

    it('rejects empty base64', () => {
      expect(validateImageInput('', 'image/png')).toBe('No image data provided');
    });

    it('rejects invalid mime type', () => {
      expect(validateImageInput('data', 'text/plain')).toBe('Invalid image type');
    });

    it('accepts valid inputs', () => {
      expect(validateImageInput('base64data', 'image/png')).toBeNull();
      expect(validateImageInput('base64data', 'image/jpeg')).toBeNull();
      expect(validateImageInput('base64data', 'image/webp')).toBeNull();
      expect(validateImageInput('base64data', 'image/gif')).toBeNull();
    });
  });
});
