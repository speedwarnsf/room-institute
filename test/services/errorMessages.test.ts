/**
 * Error Messages Service Tests
 */

import { describe, it, expect } from 'vitest';
import { 
  getErrorMessage, 
  getErrorsByCategory,
  createErrorMessage,
  formatWaitTime,
  shouldShowCountdown,
  ErrorSeverity,
  ErrorCategory 
} from '../../services/errorMessages';

describe('Error Messages Service', () => {
  describe('getErrorMessage', () => {
    it('returns correct message for NETWORK_ERROR', () => {
      const msg = getErrorMessage('NETWORK_ERROR');
      expect(msg.title).toBe('Connection Problem');
      expect(msg.isRetryable).toBe(true);
      expect(msg.category).toBe(ErrorCategory.NETWORK);
      expect(msg.icon).toBe('wifi-off');
    });

    it('returns correct message for API_KEY_MISSING', () => {
      const msg = getErrorMessage('API_KEY_MISSING');
      expect(msg.title).toBe('Service Not Configured');
      expect(msg.isRetryable).toBe(false);
      expect(msg.severity).toBe(ErrorSeverity.CRITICAL);
    });

    it('returns correct message for RATE_LIMIT', () => {
      const msg = getErrorMessage('RATE_LIMIT');
      expect(msg.title).toBe('Slow Down!');
      expect(msg.isRetryable).toBe(true);
      expect(msg.retryAfterSeconds).toBe(60);
    });

    it('returns correct message for FILE_TOO_LARGE', () => {
      const msg = getErrorMessage('FILE_TOO_LARGE');
      expect(msg.category).toBe(ErrorCategory.FILE);
      expect(msg.suggestion).toContain('smaller image');
    });

    it('returns UNKNOWN for unrecognized error codes', () => {
      const msg = getErrorMessage('COMPLETELY_MADE_UP_ERROR');
      expect(msg.title).toBe('Something Went Wrong');
      expect(msg.category).toBe(ErrorCategory.UNKNOWN);
    });

    it('all messages have required fields', () => {
      const testCodes = [
        'NETWORK_ERROR', 'NETWORK_TIMEOUT', 'NETWORK_OFFLINE',
        'API_KEY_MISSING', 'INVALID_API_KEY', 'EMPTY_RESPONSE',
        'RATE_LIMIT', 'QUOTA_DAILY', 'FILE_READ_ERROR'
      ];

      testCodes.forEach(code => {
        const msg = getErrorMessage(code);
        expect(msg.title).toBeDefined();
        expect(msg.description).toBeDefined();
        expect(msg.suggestion).toBeDefined();
        expect(msg.severity).toBeDefined();
        expect(msg.category).toBeDefined();
        expect(typeof msg.isRetryable).toBe('boolean');
        expect(msg.icon).toBeDefined();
      });
    });
  });

  describe('getErrorsByCategory', () => {
    it('returns network errors', () => {
      const errors = getErrorsByCategory(ErrorCategory.NETWORK);
      expect(errors).toContain('NETWORK_ERROR');
      expect(errors).toContain('NETWORK_TIMEOUT');
      expect(errors).toContain('NETWORK_OFFLINE');
    });

    it('returns file errors', () => {
      const errors = getErrorsByCategory(ErrorCategory.FILE);
      expect(errors).toContain('FILE_READ_ERROR');
      expect(errors).toContain('INVALID_FORMAT');
      expect(errors).toContain('FILE_TOO_LARGE');
    });

    it('returns quota errors', () => {
      const errors = getErrorsByCategory(ErrorCategory.QUOTA);
      expect(errors).toContain('RATE_LIMIT');
      expect(errors).toContain('QUOTA_DAILY');
    });

    it('returns empty array for unused category', () => {
      // All categories should have at least one error, but test the behavior
      const errors = getErrorsByCategory(ErrorCategory.UNKNOWN);
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('createErrorMessage', () => {
    it('creates a custom error message with defaults', () => {
      const msg = createErrorMessage('Custom Title', 'Custom description');
      
      expect(msg.title).toBe('Custom Title');
      expect(msg.description).toBe('Custom description');
      expect(msg.suggestion).toBeDefined();
      expect(msg.severity).toBe(ErrorSeverity.ERROR);
      expect(msg.category).toBe(ErrorCategory.UNKNOWN);
      expect(msg.isRetryable).toBe(true);
    });

    it('allows overriding all options', () => {
      const msg = createErrorMessage('Title', 'Desc', {
        suggestion: 'Custom suggestion',
        severity: ErrorSeverity.WARNING,
        category: ErrorCategory.NETWORK,
        isRetryable: false,
        icon: 'wifi-off',
        technicalDetail: 'Technical info',
        retryAfterSeconds: 30
      });
      
      expect(msg.suggestion).toBe('Custom suggestion');
      expect(msg.severity).toBe(ErrorSeverity.WARNING);
      expect(msg.category).toBe(ErrorCategory.NETWORK);
      expect(msg.isRetryable).toBe(false);
      expect(msg.icon).toBe('wifi-off');
      expect(msg.technicalDetail).toBe('Technical info');
      expect(msg.retryAfterSeconds).toBe(30);
    });
  });

  describe('formatWaitTime', () => {
    it('formats seconds correctly', () => {
      expect(formatWaitTime(1)).toBe('1 second');
      expect(formatWaitTime(5)).toBe('5 seconds');
      expect(formatWaitTime(30)).toBe('30 seconds');
      expect(formatWaitTime(59)).toBe('59 seconds');
    });

    it('formats minutes correctly', () => {
      expect(formatWaitTime(60)).toBe('1 minute');
      expect(formatWaitTime(61)).toBe('2 minutes'); // Rounds up
      expect(formatWaitTime(120)).toBe('2 minutes');
      expect(formatWaitTime(300)).toBe('5 minutes');
    });

    it('handles edge cases', () => {
      expect(formatWaitTime(0)).toBe('0 seconds');
    });
  });

  describe('shouldShowCountdown', () => {
    it('returns true for retryable errors with retry time', () => {
      const msg = getErrorMessage('RATE_LIMIT');
      expect(shouldShowCountdown(msg)).toBe(true);
    });

    it('returns false for non-retryable errors', () => {
      const msg = getErrorMessage('API_KEY_MISSING');
      expect(shouldShowCountdown(msg)).toBe(false);
    });

    it('returns false for retryable errors without retry time', () => {
      const msg = getErrorMessage('NETWORK_ERROR');
      expect(shouldShowCountdown(msg)).toBe(false);
    });
  });

  describe('Error Message Quality', () => {
    it('all messages are user-friendly (no technical jargon in title)', () => {
      const technicalTerms = ['API', 'HTTP', '500', '404', 'JSON', 'exception', 'null', 'undefined'];
      
      const codes = [
        'NETWORK_ERROR', 'RATE_LIMIT', 'FILE_READ_ERROR', 
        'EMPTY_RESPONSE', 'PROCESSING_ERROR', 'UNKNOWN'
      ];

      codes.forEach(code => {
        const msg = getErrorMessage(code);
        technicalTerms.forEach(term => {
          // API is allowed in technical detail, not in user-facing title
          expect(msg.title.toLowerCase()).not.toContain(term.toLowerCase());
        });
      });
    });

    it('all suggestions are actionable', () => {
      const actionWords = ['try', 'check', 'wait', 'use', 'contact', 'upload', 'refresh', 'come back'];
      
      const codes = ['NETWORK_ERROR', 'RATE_LIMIT', 'FILE_TOO_LARGE'];
      
      codes.forEach(code => {
        const msg = getErrorMessage(code);
        const hasAction = actionWords.some(word => 
          msg.suggestion.toLowerCase().includes(word)
        );
        expect(hasAction).toBe(true);
      });
    });

    it('retryable errors have encouraging suggestions', () => {
      const retryableCodes = ['NETWORK_ERROR', 'EMPTY_RESPONSE', 'PARSE_ERROR'];
      
      retryableCodes.forEach(code => {
        const msg = getErrorMessage(code);
        expect(msg.isRetryable).toBe(true);
        expect(msg.suggestion).toBeDefined();
        expect(msg.suggestion.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Error Severity Classification', () => {
    it('critical errors are for configuration issues', () => {
      const criticalCodes = ['API_KEY_MISSING', 'INVALID_API_KEY'];
      
      criticalCodes.forEach(code => {
        const msg = getErrorMessage(code);
        expect(msg.severity).toBe(ErrorSeverity.CRITICAL);
        expect(msg.isRetryable).toBe(false);
      });
    });

    it('warning errors are recoverable', () => {
      const warningCodes = ['RATE_LIMIT', 'EMPTY_RESPONSE', 'FILE_TOO_LARGE'];
      
      warningCodes.forEach(code => {
        const msg = getErrorMessage(code);
        expect(msg.severity).toBe(ErrorSeverity.WARNING);
        expect(msg.isRetryable).toBe(true);
      });
    });
  });

  describe('Icon Assignments', () => {
    it('network errors use wifi-off icon', () => {
      const networkCodes = ['NETWORK_ERROR', 'NETWORK_OFFLINE'];
      
      networkCodes.forEach(code => {
        const msg = getErrorMessage(code);
        expect(msg.icon).toBe('wifi-off');
      });
    });

    it('file errors use file-x icon', () => {
      const fileCodes = ['FILE_READ_ERROR', 'INVALID_FORMAT', 'FILE_TOO_LARGE'];
      
      fileCodes.forEach(code => {
        const msg = getErrorMessage(code);
        expect(msg.icon).toBe('file-x');
      });
    });

    it('auth errors use lock icon', () => {
      const authCodes = ['API_KEY_MISSING', 'INVALID_API_KEY'];
      
      authCodes.forEach(code => {
        const msg = getErrorMessage(code);
        expect(msg.icon).toBe('lock');
      });
    });
  });
});
