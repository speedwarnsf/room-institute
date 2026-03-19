/**
 * Input Validation Utilities for ZenSpace
 * 
 * Provides comprehensive validation for user inputs including:
 * - File validation (type, size, dimensions)
 * - Image data validation
 * - Input sanitization
 */

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
  details?: Record<string, unknown>;
}

/**
 * Supported image MIME types
 */
export const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type SupportedMimeType = typeof SUPPORTED_MIME_TYPES[number];

/**
 * File size limits
 */
export const FILE_SIZE_LIMITS = {
  MIN_BYTES: 1024, // 1KB - too small is probably not a real image
  MAX_BYTES: 10 * 1024 * 1024, // 10MB
  RECOMMENDED_MAX_BYTES: 5 * 1024 * 1024, // 5MB for optimal performance
};

/**
 * Image dimension limits
 */
export const DIMENSION_LIMITS = {
  MIN_WIDTH: 100,
  MIN_HEIGHT: 100,
  MAX_WIDTH: 8192,
  MAX_HEIGHT: 8192,
  RECOMMENDED_MIN_WIDTH: 640,
  RECOMMENDED_MIN_HEIGHT: 480,
};

/**
 * Validate file type
 */
export function validateFileType(file: File): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!file.type) {
    return { valid: false, error: 'File type could not be determined' };
  }

  if (!SUPPORTED_MIME_TYPES.includes(file.type as SupportedMimeType)) {
    const supported = SUPPORTED_MIME_TYPES.map(t => t.replace('image/', '')).join(', ');
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Supported formats: ${supported}`,
      details: { actualType: file.type, supportedTypes: SUPPORTED_MIME_TYPES },
    };
  }

  return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(sizeBytes: number): ValidationResult {
  if (sizeBytes < FILE_SIZE_LIMITS.MIN_BYTES) {
    return {
      valid: false,
      error: 'File is too small to be a valid image',
      details: { size: sizeBytes, minSize: FILE_SIZE_LIMITS.MIN_BYTES },
    };
  }

  if (sizeBytes > FILE_SIZE_LIMITS.MAX_BYTES) {
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
    const maxMB = (FILE_SIZE_LIMITS.MAX_BYTES / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File is too large (${sizeMB}MB). Maximum size is ${maxMB}MB.`,
      details: { size: sizeBytes, maxSize: FILE_SIZE_LIMITS.MAX_BYTES },
    };
  }

  // Warn about large files
  if (sizeBytes > FILE_SIZE_LIMITS.RECOMMENDED_MAX_BYTES) {
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: true,
      warning: `Large file (${sizeMB}MB) may take longer to process`,
      details: { size: sizeBytes },
    };
  }

  return { valid: true };
}

/**
 * Validate image dimensions
 */
export function validateDimensions(width: number, height: number): ValidationResult {
  if (!width || !height || width <= 0 || height <= 0) {
    return { valid: false, error: 'Invalid image dimensions' };
  }

  if (width < DIMENSION_LIMITS.MIN_WIDTH || height < DIMENSION_LIMITS.MIN_HEIGHT) {
    return {
      valid: false,
      error: `Image is too small (${width}x${height}). Minimum size is ${DIMENSION_LIMITS.MIN_WIDTH}x${DIMENSION_LIMITS.MIN_HEIGHT} pixels.`,
      details: { width, height },
    };
  }

  if (width > DIMENSION_LIMITS.MAX_WIDTH || height > DIMENSION_LIMITS.MAX_HEIGHT) {
    return {
      valid: true,
      warning: `Large image (${width}x${height}) will be resized for processing`,
      details: { width, height },
    };
  }

  // Check aspect ratio - extreme ratios don't work well
  const aspectRatio = width / height;
  if (aspectRatio > 10 || aspectRatio < 0.1) {
    return {
      valid: false,
      error: 'Image has an extreme aspect ratio. Please use a more standard shape.',
      details: { width, height, aspectRatio },
    };
  }

  // Warn about small images
  if (width < DIMENSION_LIMITS.RECOMMENDED_MIN_WIDTH || height < DIMENSION_LIMITS.RECOMMENDED_MIN_HEIGHT) {
    return {
      valid: true,
      warning: `Small image (${width}x${height}) may produce less detailed analysis`,
      details: { width, height },
    };
  }

  return { valid: true };
}

/**
 * Validate base64 image data
 */
export function validateBase64Data(base64: string): ValidationResult {
  if (!base64 || base64.trim().length === 0) {
    return { valid: false, error: 'No image data provided' };
  }

  // Check for valid base64 characters
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  if (!base64Regex.test(base64)) {
    return { valid: false, error: 'Invalid image data format' };
  }

  // Check for proper padding (base64 length should be multiple of 4)
  if (base64.length % 4 !== 0) {
    return { valid: false, error: 'Corrupted image data' };
  }

  // Minimum size check - a tiny base64 can't be a real image
  if (base64.length < 100) {
    return { valid: false, error: 'Image data is too small to be valid' };
  }

  return { valid: true };
}

/**
 * Validate MIME type string
 */
export function validateMimeType(mimeType: string): ValidationResult {
  if (!mimeType) {
    return { valid: false, error: 'No MIME type provided' };
  }

  if (!SUPPORTED_MIME_TYPES.includes(mimeType as SupportedMimeType)) {
    return {
      valid: false,
      error: `Unsupported image type: ${mimeType}`,
      details: { mimeType, supportedTypes: SUPPORTED_MIME_TYPES },
    };
  }

  return { valid: true };
}

/**
 * Parse and validate a data URL
 */
export function parseAndValidateDataUrl(dataUrl: string): {
  valid: boolean;
  error?: string;
  mimeType?: string;
  base64?: string;
} {
  if (!dataUrl) {
    return { valid: false, error: 'No data URL provided' };
  }

  if (!dataUrl.startsWith('data:')) {
    return { valid: false, error: 'Invalid data URL format' };
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match || match.length !== 3) {
    return { valid: false, error: 'Could not parse data URL' };
  }

  const mimeType = match[1];
  const base64 = match[2];

  if (!mimeType || !base64) {
    return { valid: false, error: 'Invalid data URL structure' };
  }

  const mimeResult = validateMimeType(mimeType);
  if (!mimeResult.valid) {
    return { valid: false, error: mimeResult.error };
  }

  const base64Result = validateBase64Data(base64);
  if (!base64Result.valid) {
    return { valid: false, error: base64Result.error };
  }

  return { valid: true, mimeType, base64 };
}

/**
 * Comprehensive file validation
 */
export function validateFile(file: File): ValidationResult {
  // Check type
  const typeResult = validateFileType(file);
  if (!typeResult.valid) {
    return typeResult;
  }

  // Check size
  const sizeResult = validateFileSize(file.size);
  if (!sizeResult.valid) {
    return sizeResult;
  }

  // Return with any warnings
  return {
    valid: true,
    warning: sizeResult.warning,
    details: { type: file.type, size: file.size, name: file.name },
  };
}

/**
 * Sanitize a filename for display
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'image';
  
  // Remove path separators
  let sanitized = filename.replace(/[/\\]/g, '');
  
  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');
  
  // Limit length
  if (sanitized.length > 100) {
    const ext = sanitized.match(/\.[^.]+$/)?.[0] || '';
    sanitized = sanitized.slice(0, 100 - ext.length) + ext;
  }
  
  return sanitized || 'image';
}

/**
 * Check if a string contains only safe characters for user display
 */
export function isSafeForDisplay(text: string): boolean {
  // Check for control characters (except newlines and tabs)
  const controlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;
  if (controlChars.test(text)) {
    return false;
  }
  
  return true;
}

/**
 * Sanitize text for safe display
 */
export function sanitizeForDisplay(text: string): string {
  if (!text) return '';
  
  // Remove control characters
  let sanitized = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  return sanitized.trim();
}

/**
 * Validate chat message input
 */
export function validateChatMessage(message: string): ValidationResult {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  const trimmed = message.trim();
  
  if (trimmed.length > 2000) {
    return {
      valid: false,
      error: 'Message is too long. Maximum length is 2000 characters.',
      details: { length: trimmed.length, maxLength: 2000 },
    };
  }

  if (!isSafeForDisplay(trimmed)) {
    return { valid: false, error: 'Message contains invalid characters' };
  }

  return { valid: true };
}
