/**
 * Edge Case Handlers for ZenSpace
 * Robust handling of unusual scenarios and edge cases
 */
import { compressImage } from './imageCompression';
import { analytics } from './analytics';

export interface EdgeCaseResult {
  canProceed: boolean;
  warning?: string;
  error?: string;
  suggestion?: string;
  modifiedFile?: File;
}

// Maximum file sizes (in bytes)
export const FILE_LIMITS = {
  MAX_SIZE: 50 * 1024 * 1024,        // 50MB absolute max
  IDEAL_SIZE: 2 * 1024 * 1024,       // 2MB ideal max (keeps base64 under Vercel's 4.5MB limit)
  COMPRESSION_THRESHOLD: 1 * 1024 * 1024, // 1MB compression threshold
  TINY_FILE: 10 * 1024,              // 10KB minimum size
} as const;

// Image dimension limits
export const DIMENSION_LIMITS = {
  MIN_WIDTH: 200,
  MIN_HEIGHT: 200,
  MAX_WIDTH: 8192,
  MAX_HEIGHT: 8192,
  IDEAL_MIN_WIDTH: 600,
  IDEAL_MIN_HEIGHT: 400,
} as const;

/**
 * Validate file before processing
 */
export async function validateImageFile(file: File): Promise<EdgeCaseResult> {
  // Check basic file properties
  const basicValidation = validateBasicFileProperties(file);
  if (!basicValidation.canProceed) {
    return basicValidation;
  }

  // Check file size
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.canProceed) {
    return sizeValidation;
  }

  // Check image dimensions and format
  const dimensionValidation = await validateImageDimensions(file);
  if (!dimensionValidation.canProceed) {
    return dimensionValidation;
  }

  // Check for potential corruption
  const corruptionCheck = await checkImageCorruption(file);
  if (!corruptionCheck.canProceed) {
    return corruptionCheck;
  }

  // All checks passed
  return { canProceed: true };
}

/**
 * Basic file property validation
 */
function validateBasicFileProperties(file: File): EdgeCaseResult {
  // Check if file exists
  if (!file) {
    return {
      canProceed: false,
      error: 'No file provided'
    };
  }

  // Check file name
  if (!file.name || file.name.trim() === '') {
    return {
      canProceed: false,
      error: 'Invalid file name'
    };
  }

  // Check MIME type
  const validMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/heic', // iPhone photos
    'image/heif'  // iPhone photos
  ];

  if (!file.type || !validMimeTypes.includes(file.type.toLowerCase())) {
    return {
      canProceed: false,
      error: 'Invalid file format. Please use JPG, PNG, WebP, or HEIC images.',
      suggestion: 'Convert your image to JPG or PNG format and try again.'
    };
  }

  // Check for suspicious file extensions
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']
    .some(ext => fileName.endsWith(ext));

  if (!hasValidExtension) {
    return {
      canProceed: false,
      error: 'File extension doesn\'t match image format',
      suggestion: 'Make sure your file has the correct extension (.jpg, .png, etc.)'
    };
  }

  return { canProceed: true };
}

/**
 * File size validation with smart handling
 */
function validateFileSize(file: File): EdgeCaseResult {
  const size = file.size;

  // Too large
  if (size > FILE_LIMITS.MAX_SIZE) {
    analytics.track('image_rejected', {
      reason: 'too_large',
      fileSize: size,
      limit: FILE_LIMITS.MAX_SIZE
    });

    return {
      canProceed: false,
      error: `Image is too large (${formatFileSize(size)}). Maximum size is ${formatFileSize(FILE_LIMITS.MAX_SIZE)}.`,
      suggestion: 'Try compressing the image or taking a new photo with lower resolution.'
    };
  }

  // Too small (probably corrupted or not a real image)
  if (size < FILE_LIMITS.TINY_FILE) {
    analytics.track('image_rejected', {
      reason: 'too_small',
      fileSize: size,
      limit: FILE_LIMITS.TINY_FILE
    });

    return {
      canProceed: false,
      error: `Image is too small (${formatFileSize(size)}). This might be a corrupted file.`,
      suggestion: 'Please try uploading a different image or retake the photo.'
    };
  }

  // Large but acceptable - will need compression
  if (size > FILE_LIMITS.IDEAL_SIZE) {
    return {
      canProceed: true,
      warning: `Large image (${formatFileSize(size)}) will be compressed for optimal performance.`
    };
  }

  return { canProceed: true };
}

/**
 * Image dimension validation
 */
async function validateImageDimensions(file: File): Promise<EdgeCaseResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const { width, height } = img;

      // Too small
      if (width < DIMENSION_LIMITS.MIN_WIDTH || height < DIMENSION_LIMITS.MIN_HEIGHT) {
        analytics.track('image_rejected', {
          reason: 'dimensions_too_small',
          width,
          height,
          minWidth: DIMENSION_LIMITS.MIN_WIDTH,
          minHeight: DIMENSION_LIMITS.MIN_HEIGHT
        });

        resolve({
          canProceed: false,
          error: `Image too small (${width}×${height}). Minimum size is ${DIMENSION_LIMITS.MIN_WIDTH}×${DIMENSION_LIMITS.MIN_HEIGHT}.`,
          suggestion: 'Use a higher resolution image for better analysis results.'
        });
        return;
      }

      // Too large
      if (width > DIMENSION_LIMITS.MAX_WIDTH || height > DIMENSION_LIMITS.MAX_HEIGHT) {
        analytics.track('image_rejected', {
          reason: 'dimensions_too_large', 
          width,
          height,
          maxWidth: DIMENSION_LIMITS.MAX_WIDTH,
          maxHeight: DIMENSION_LIMITS.MAX_HEIGHT
        });

        resolve({
          canProceed: false,
          error: `Image too large (${width}×${height}). Maximum size is ${DIMENSION_LIMITS.MAX_WIDTH}×${DIMENSION_LIMITS.MAX_HEIGHT}.`,
          suggestion: 'Resize the image to a smaller resolution.'
        });
        return;
      }

      // Suboptimal dimensions
      if (width < DIMENSION_LIMITS.IDEAL_MIN_WIDTH || height < DIMENSION_LIMITS.IDEAL_MIN_HEIGHT) {
        resolve({
          canProceed: true,
          warning: `Image resolution (${width}×${height}) is low. Higher resolution images provide better analysis.`
        });
        return;
      }

      // Extremely wide or narrow images
      const aspectRatio = width / height;
      if (aspectRatio > 5 || aspectRatio < 0.2) {
        resolve({
          canProceed: true,
          warning: 'Unusual image proportions detected. Results may be less accurate for very wide or tall images.'
        });
        return;
      }

      resolve({ canProceed: true });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      
      analytics.track('image_rejected', {
        reason: 'load_failed',
        fileSize: file.size,
        mimeType: file.type
      });

      resolve({
        canProceed: false,
        error: 'Unable to load image. The file may be corrupted.',
        suggestion: 'Try uploading a different image or retake the photo.'
      });
    };

    img.src = url;
  });
}

/**
 * Check for image corruption
 */
async function checkImageCorruption(file: File): Promise<EdgeCaseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      
      if (!arrayBuffer) {
        resolve({
          canProceed: false,
          error: 'Unable to read image file.',
          suggestion: 'The file may be corrupted. Try uploading a different image.'
        });
        return;
      }

      const bytes = new Uint8Array(arrayBuffer);
      
      // Check file headers for common image formats
      if (isValidImageHeader(bytes, file.type)) {
        resolve({ canProceed: true });
      } else {
        analytics.track('image_rejected', {
          reason: 'invalid_header',
          mimeType: file.type,
          fileSize: file.size
        });

        resolve({
          canProceed: false,
          error: 'Image file appears to be corrupted or invalid.',
          suggestion: 'Try uploading a different image or saving it in a different format.'
        });
      }
    };

    reader.onerror = () => {
      resolve({
        canProceed: false,
        error: 'Unable to read image file.',
        suggestion: 'The file may be corrupted or damaged.'
      });
    };

    // Only read the first few bytes to check header
    const blob = file.slice(0, 32);
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Validate image file headers
 */
function isValidImageHeader(bytes: Uint8Array, mimeType: string): boolean {
  if (bytes.length < 4) return false;

  // JPEG: FF D8 FF
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
  }

  // PNG: 89 50 4E 47
  if (mimeType.includes('png')) {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
  }

  // WebP: 52 49 46 46 (RIFF)
  if (mimeType.includes('webp')) {
    return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  }

  // HEIC/HEIF: More complex format, basic check
  if (mimeType.includes('heic') || mimeType.includes('heif')) {
    // Look for 'ftyp' box type at offset 4-8
    const ftypCheck = bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;
    return ftypCheck;
  }

  return false;
}

/**
 * Handle special browser scenarios
 */
export function detectBrowserLimitations(): {
  hasLimitations: boolean;
  limitations: string[];
  recommendations: string[];
} {
  const limitations: string[] = [];
  const recommendations: string[] = [];

  // Check for mobile Safari which has stricter memory limits
  const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);
  if (isIOSSafari) {
    limitations.push('iOS Safari has stricter memory limits for image processing');
    recommendations.push('Use smaller images (under 5MB) for best performance');
  }

  // Check for older browsers that might not support newer image formats
  const supportsWebP = (() => {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  })();

  if (!supportsWebP) {
    limitations.push('WebP images not supported in this browser');
    recommendations.push('Use JPG or PNG format instead');
  }

  // Check available memory (if supported)
  const memory = (navigator as any).deviceMemory;
  if (memory && memory < 4) {
    limitations.push('Limited device memory detected');
    recommendations.push('Use compressed images for better performance');
  }

  // Check connection speed
  const connection = (navigator as any).connection;
  if (connection) {
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      limitations.push('Slow network connection detected');
      recommendations.push('Consider using smaller images to reduce upload time');
    }
  }

  return {
    hasLimitations: limitations.length > 0,
    limitations,
    recommendations
  };
}

/**
 * Smart image preprocessing
 */
export async function preprocessImage(file: File): Promise<{
  file: File;
  wasModified: boolean;
  modifications: string[];
}> {
  const modifications: string[] = [];
  let processedFile = file;
  let wasModified = false;

  // Check if compression is needed
  if (file.size > FILE_LIMITS.COMPRESSION_THRESHOLD) {
    try {
      const compressed = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        targetSize: FILE_LIMITS.IDEAL_SIZE
      });
      
      processedFile = compressed.file;
      wasModified = true;
      modifications.push(`Compressed from ${formatFileSize(file.size)} to ${formatFileSize(compressed.file.size)}`);
      
      analytics.track('image_compressed', {
        originalSize: file.size,
        compressedSize: compressed.file.size,
        compressionRatio: compressed.ratio,
        automatic: true
      });
    } catch {
      // Compression failed — continue with original file
    }
  }

  return {
    file: processedFile,
    wasModified,
    modifications
  };
}

/**
 * Handle network timeout scenarios
 */
export function createTimeoutHandler(timeoutMs: number = 30000) {
  return {
    withTimeout<T>(promise: Promise<T>): Promise<T> {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Operation timed out'));
          }, timeoutMs);
        })
      ]);
    },
    
    createAbortableRequest(url: string, options: RequestInit = {}): {
      request: Promise<Response>;
      abort: () => void;
    } {
      const controller = new AbortController();
      
      const request = fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      setTimeout(() => {
        controller.abort();
      }, timeoutMs);
      
      return {
        request,
        abort: () => controller.abort()
      };
    }
  };
}

/**
 * Format file size for human readability
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Browser compatibility checker
 */
export function checkBrowserCompatibility(): {
  isSupported: boolean;
  missingFeatures: string[];
  recommendations: string[];
} {
  const missingFeatures: string[] = [];
  const recommendations: string[] = [];

  // Check for File API support
  if (!window.File || !window.FileReader) {
    missingFeatures.push('File API');
    recommendations.push('Update to a modern browser (Chrome 13+, Firefox 7+, Safari 6+)');
  }

  // Check for Canvas API support
  const canvas = document.createElement('canvas');
  if (!canvas.getContext || !canvas.getContext('2d')) {
    missingFeatures.push('Canvas API');
    recommendations.push('Enable JavaScript and update your browser');
  }

  // Check for Fetch API support
  if (!window.fetch) {
    missingFeatures.push('Fetch API');
    recommendations.push('Update to a modern browser or use a polyfill');
  }

  // Check for WebP support (nice to have)
  try {
    const testCanvas = document.createElement('canvas');
    testCanvas.toDataURL('image/webp');
  } catch (e) {
    // WebP not critical, just note it
  }

  return {
    isSupported: missingFeatures.length === 0,
    missingFeatures,
    recommendations
  };
}

export default {
  validateImageFile,
  detectBrowserLimitations,
  preprocessImage,
  createTimeoutHandler,
  checkBrowserCompatibility,
  FILE_LIMITS,
  DIMENSION_LIMITS
};