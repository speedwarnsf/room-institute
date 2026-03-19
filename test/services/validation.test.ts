/**
 * Validation Service Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateFileType,
  validateFileSize,
  validateDimensions,
  validateBase64Data,
  validateMimeType,
  parseAndValidateDataUrl,
  validateFile,
  sanitizeFilename,
  isSafeForDisplay,
  sanitizeForDisplay,
  validateChatMessage,
  SUPPORTED_MIME_TYPES,
  FILE_SIZE_LIMITS,
  DIMENSION_LIMITS,
} from '../../services/validation';

describe('Validation Service', () => {
  describe('validateFileType', () => {
    it('accepts supported image types', () => {
      SUPPORTED_MIME_TYPES.forEach(mimeType => {
        const file = new File(['test'], 'test.jpg', { type: mimeType });
        const result = validateFileType(file);
        expect(result.valid).toBe(true);
      });
    });

    it('rejects unsupported types', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const result = validateFileType(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported');
    });

    it('rejects files without type', () => {
      const file = new File(['test'], 'test');
      Object.defineProperty(file, 'type', { value: '' });
      const result = validateFileType(file);
      expect(result.valid).toBe(false);
    });

    it('includes details on failure', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = validateFileType(file);
      expect(result.details?.actualType).toBe('text/plain');
    });
  });

  describe('validateFileSize', () => {
    it('accepts files within limits', () => {
      const result = validateFileSize(1024 * 1024); // 1MB
      expect(result.valid).toBe(true);
    });

    it('rejects files that are too small', () => {
      const result = validateFileSize(100); // 100 bytes
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too small');
    });

    it('rejects files that are too large', () => {
      const result = validateFileSize(15 * 1024 * 1024); // 15MB
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
    });

    it('warns about large files', () => {
      const result = validateFileSize(7 * 1024 * 1024); // 7MB
      expect(result.valid).toBe(true);
      expect(result.warning).toContain('Large file');
    });

    it('accepts exactly at limits', () => {
      const minResult = validateFileSize(FILE_SIZE_LIMITS.MIN_BYTES);
      expect(minResult.valid).toBe(true);

      const maxResult = validateFileSize(FILE_SIZE_LIMITS.MAX_BYTES);
      expect(maxResult.valid).toBe(true);
    });
  });

  describe('validateDimensions', () => {
    it('accepts valid dimensions', () => {
      const result = validateDimensions(1920, 1080);
      expect(result.valid).toBe(true);
    });

    it('rejects zero dimensions', () => {
      expect(validateDimensions(0, 1080).valid).toBe(false);
      expect(validateDimensions(1920, 0).valid).toBe(false);
    });

    it('rejects negative dimensions', () => {
      expect(validateDimensions(-100, 100).valid).toBe(false);
    });

    it('rejects too small images', () => {
      const result = validateDimensions(50, 50);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too small');
    });

    it('warns about large images', () => {
      const result = validateDimensions(10000, 8000);
      expect(result.valid).toBe(true);
      expect(result.warning).toContain('resized');
    });

    it('rejects extreme aspect ratios', () => {
      // Too wide
      expect(validateDimensions(2000, 100).valid).toBe(false);
      // Too tall
      expect(validateDimensions(100, 2000).valid).toBe(false);
    });

    it('warns about small images', () => {
      const result = validateDimensions(320, 240);
      expect(result.valid).toBe(true);
      expect(result.warning).toContain('Small image');
    });
  });

  describe('validateBase64Data', () => {
    it('accepts valid base64', () => {
      const validBase64 = 'AAAA'.repeat(100); // 400 chars, valid padding
      const result = validateBase64Data(validBase64);
      expect(result.valid).toBe(true);
    });

    it('rejects empty data', () => {
      expect(validateBase64Data('').valid).toBe(false);
      expect(validateBase64Data('   ').valid).toBe(false);
    });

    it('rejects invalid characters', () => {
      const result = validateBase64Data('invalid!@#$characters');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid');
    });

    it('rejects incorrect padding', () => {
      const result = validateBase64Data('AAA'); // Length not multiple of 4
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Corrupted');
    });

    it('rejects too small data', () => {
      const result = validateBase64Data('AAAA'); // Only 4 chars
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too small');
    });
  });

  describe('validateMimeType', () => {
    it('accepts supported types', () => {
      SUPPORTED_MIME_TYPES.forEach(type => {
        expect(validateMimeType(type).valid).toBe(true);
      });
    });

    it('rejects unsupported types', () => {
      expect(validateMimeType('video/mp4').valid).toBe(false);
      expect(validateMimeType('text/html').valid).toBe(false);
      expect(validateMimeType('application/json').valid).toBe(false);
    });

    it('rejects empty type', () => {
      expect(validateMimeType('').valid).toBe(false);
    });
  });

  describe('parseAndValidateDataUrl', () => {
    it('parses valid data URL', () => {
      const base64 = 'AAAA'.repeat(100);
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      
      const result = parseAndValidateDataUrl(dataUrl);
      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.base64).toBe(base64);
    });

    it('rejects invalid format', () => {
      expect(parseAndValidateDataUrl('not-a-data-url').valid).toBe(false);
      expect(parseAndValidateDataUrl('http://example.com/image.jpg').valid).toBe(false);
    });

    it('rejects empty input', () => {
      expect(parseAndValidateDataUrl('').valid).toBe(false);
    });

    it('rejects unsupported mime types in data URL', () => {
      const result = parseAndValidateDataUrl('data:text/plain;base64,AAAA'.repeat(100));
      expect(result.valid).toBe(false);
    });
  });

  describe('validateFile', () => {
    it('validates complete file', () => {
      const file = new File(['x'.repeat(10000)], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 100 }); // 100KB
      
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('returns error for invalid type', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
    });

    it('returns error for invalid size', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 50 * 1024 * 1024 }); // 50MB
      
      const result = validateFile(file);
      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('returns filename unchanged for safe names', () => {
      expect(sanitizeFilename('photo.jpg')).toBe('photo.jpg');
      expect(sanitizeFilename('my_image_2024.png')).toBe('my_image_2024.png');
    });

    it('removes path separators', () => {
      expect(sanitizeFilename('/etc/passwd')).toBe('etcpasswd');
      expect(sanitizeFilename('..\\..\\secret.jpg')).toBe('....secret.jpg');
    });

    it('removes dangerous characters', () => {
      expect(sanitizeFilename('file<script>.jpg')).toBe('filescript.jpg');
      expect(sanitizeFilename('test|command.png')).toBe('testcommand.png');
    });

    it('limits filename length', () => {
      const longName = 'a'.repeat(150) + '.jpg';
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(100);
      expect(result.endsWith('.jpg')).toBe(true);
    });

    it('handles empty input', () => {
      expect(sanitizeFilename('')).toBe('image');
    });
  });

  describe('isSafeForDisplay', () => {
    it('accepts normal text', () => {
      expect(isSafeForDisplay('Hello, world!')).toBe(true);
      expect(isSafeForDisplay('Test with émojis 🎉')).toBe(true);
    });

    it('accepts newlines and tabs', () => {
      expect(isSafeForDisplay('Line 1\nLine 2')).toBe(true);
      expect(isSafeForDisplay('Col 1\tCol 2')).toBe(true);
    });

    it('rejects control characters', () => {
      expect(isSafeForDisplay('text\x00hidden')).toBe(false);
      expect(isSafeForDisplay('text\x1Fhidden')).toBe(false);
    });
  });

  describe('sanitizeForDisplay', () => {
    it('removes control characters', () => {
      expect(sanitizeForDisplay('hello\x00world')).toBe('helloworld');
    });

    it('normalizes whitespace', () => {
      expect(sanitizeForDisplay('hello    world')).toBe('hello world');
      expect(sanitizeForDisplay('  hello  ')).toBe('hello');
    });

    it('handles empty input', () => {
      expect(sanitizeForDisplay('')).toBe('');
      expect(sanitizeForDisplay(null as unknown as string)).toBe('');
    });
  });

  describe('validateChatMessage', () => {
    it('accepts valid messages', () => {
      const result = validateChatMessage('How do I organize my closet?');
      expect(result.valid).toBe(true);
    });

    it('rejects empty messages', () => {
      expect(validateChatMessage('').valid).toBe(false);
      expect(validateChatMessage('   ').valid).toBe(false);
    });

    it('rejects too long messages', () => {
      const longMessage = 'a'.repeat(2001);
      const result = validateChatMessage(longMessage);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });

    it('rejects messages with control characters', () => {
      const result = validateChatMessage('hello\x00world');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    it('accepts messages at max length', () => {
      const maxMessage = 'a'.repeat(2000);
      const result = validateChatMessage(maxMessage);
      expect(result.valid).toBe(true);
    });
  });

  describe('Constants', () => {
    it('SUPPORTED_MIME_TYPES contains expected types', () => {
      expect(SUPPORTED_MIME_TYPES).toContain('image/jpeg');
      expect(SUPPORTED_MIME_TYPES).toContain('image/png');
      expect(SUPPORTED_MIME_TYPES).toContain('image/webp');
      expect(SUPPORTED_MIME_TYPES).toContain('image/gif');
    });

    it('FILE_SIZE_LIMITS are reasonable', () => {
      expect(FILE_SIZE_LIMITS.MIN_BYTES).toBeLessThan(FILE_SIZE_LIMITS.MAX_BYTES);
      expect(FILE_SIZE_LIMITS.RECOMMENDED_MAX_BYTES).toBeLessThan(FILE_SIZE_LIMITS.MAX_BYTES);
    });

    it('DIMENSION_LIMITS are reasonable', () => {
      expect(DIMENSION_LIMITS.MIN_WIDTH).toBeLessThan(DIMENSION_LIMITS.MAX_WIDTH);
      expect(DIMENSION_LIMITS.MIN_HEIGHT).toBeLessThan(DIMENSION_LIMITS.MAX_HEIGHT);
    });
  });
});
