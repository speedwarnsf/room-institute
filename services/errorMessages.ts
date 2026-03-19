/**
 * User-friendly error messages for Room
 * 
 * This module provides consistent, helpful error messages with:
 * - Clear explanations of what went wrong
 * - Actionable suggestions for the user
 * - Context-aware messaging
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',       // User can continue, just FYI
  WARNING = 'warning', // Something might be wrong, but can proceed
  ERROR = 'error',     // Something went wrong, needs attention
  CRITICAL = 'critical' // App cannot function
}

/**
 * Error category for grouping similar errors
 */
export enum ErrorCategory {
  NETWORK = 'network',
  API = 'api',
  FILE = 'file',
  QUOTA = 'quota',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

/**
 * Structured error message with all user-facing content
 */
export interface UserErrorMessage {
  /** Main error title/heading */
  title: string;
  /** Detailed explanation of what happened */
  description: string;
  /** What the user can do to fix it */
  suggestion: string;
  /** Technical details (for support/debugging) */
  technicalDetail?: string;
  /** Error severity */
  severity: ErrorSeverity;
  /** Error category */
  category: ErrorCategory;
  /** Whether a retry might help */
  isRetryable: boolean;
  /** Approximate wait time before retry (if applicable) */
  retryAfterSeconds?: number;
  /** Icon name suggestion */
  icon: 'wifi-off' | 'alert-circle' | 'clock' | 'lock' | 'file-x' | 'server' | 'help-circle';
}

/**
 * Error code to message mapping
 */
const errorMessages: Record<string, UserErrorMessage> = {
  // Network errors
  NETWORK_ERROR: {
    title: 'Connection Problem',
    description: 'We couldn\'t reach our servers. This usually means your internet connection is unstable or temporarily down.',
    suggestion: 'Check your internet connection and try again. If you\'re on WiFi, try moving closer to your router.',
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.NETWORK,
    isRetryable: true,
    icon: 'wifi-off'
  },
  NETWORK_TIMEOUT: {
    title: 'Request Timed Out',
    description: 'The request took too long to complete. This can happen with slow connections or large images.',
    suggestion: 'Try again with a smaller image, or check if your connection is stable.',
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.NETWORK,
    isRetryable: true,
    retryAfterSeconds: 5,
    icon: 'clock'
  },
  NETWORK_OFFLINE: {
    title: 'You\'re Offline',
    description: 'Your device appears to be disconnected from the internet.',
    suggestion: 'Reconnect to the internet and try again. Room needs an internet connection to analyze images.',
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.NETWORK,
    isRetryable: true,
    icon: 'wifi-off'
  },

  // API errors
  API_KEY_MISSING: {
    title: 'Service Not Configured',
    description: 'The AI service hasn\'t been set up yet. This is a configuration issue that needs to be fixed by the administrator.',
    suggestion: 'If you\'re the site owner, add your Gemini API key to the environment variables.',
    technicalDetail: 'Set GEMINI_API_KEY in your .env file',
    severity: ErrorSeverity.CRITICAL,
    category: ErrorCategory.API,
    isRetryable: false,
    icon: 'lock'
  },
  INVALID_API_KEY: {
    title: 'Service Access Denied',
    description: 'The AI service rejected our authentication. This usually means the API key is invalid or expired.',
    suggestion: 'If you\'re the site owner, check that your API key is correct and hasn\'t expired.',
    severity: ErrorSeverity.CRITICAL,
    category: ErrorCategory.API,
    isRetryable: false,
    icon: 'lock'
  },
  EMPTY_RESPONSE: {
    title: 'Empty Response',
    description: 'The AI analyzed your image but returned an empty result. This can happen with very dark or blurry images.',
    suggestion: 'Try a clearer photo with better lighting. Make sure the room is visible in the image.',
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.API,
    isRetryable: true,
    icon: 'help-circle'
  },
  PARSE_ERROR: {
    title: 'Processing Error',
    description: 'We received a response but couldn\'t process it correctly. This is a temporary glitch.',
    suggestion: 'Please try again. If this keeps happening, try a different image.',
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.API,
    isRetryable: true,
    icon: 'server'
  },
  INVALID_RESPONSE: {
    title: 'Unexpected Response',
    description: 'The AI returned something we didn\'t expect. This is usually a temporary issue.',
    suggestion: 'Please try again in a moment. If the problem persists, try a different image.',
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.API,
    isRetryable: true,
    icon: 'help-circle'
  },

  // Quota/Rate limit errors
  RATE_LIMIT: {
    title: 'Slow Down!',
    description: 'You\'re making requests faster than our service can handle.',
    suggestion: 'Wait a moment before trying again. This limit resets quickly.',
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.QUOTA,
    isRetryable: true,
    retryAfterSeconds: 60,
    icon: 'clock'
  },
  QUOTA_DAILY: {
    title: 'Daily Limit Reached',
    description: 'We\'ve reached the maximum number of analyses for today.',
    suggestion: 'Please come back tomorrow when the limit resets, or contact support for a higher quota.',
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.QUOTA,
    isRetryable: false,
    icon: 'clock'
  },
  QUOTA_TOKENS: {
    title: 'Image Too Complex',
    description: 'This image requires more processing power than we can provide in a single request.',
    suggestion: 'Try a smaller or less detailed image. Photos of single rooms work best.',
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.QUOTA,
    isRetryable: true,
    icon: 'file-x'
  },
  TOO_MANY_REQUESTS: {
    title: 'Too Many Uploads',
    description: 'You have several analyses in progress. Please wait for them to complete.',
    suggestion: 'Wait for your current analysis to finish before starting a new one.',
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.QUOTA,
    isRetryable: true,
    retryAfterSeconds: 30,
    icon: 'clock'
  },

  // File errors
  FILE_READ_ERROR: {
    title: 'Couldn\'t Read File',
    description: 'We had trouble reading your image file. It might be corrupted or in an unsupported format.',
    suggestion: 'Try a different image, or re-save this image in a standard format (JPG or PNG).',
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.FILE,
    isRetryable: true,
    icon: 'file-x'
  },
  INVALID_FORMAT: {
    title: 'Unsupported Format',
    description: 'This file type isn\'t supported. We work best with photos.',
    suggestion: 'Upload a JPG, PNG, or WebP image. Screenshots and photos from your phone work great!',
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.FILE,
    isRetryable: true,
    icon: 'file-x'
  },
  FILE_TOO_LARGE: {
    title: 'Image Too Large',
    description: 'This image is larger than 10MB, which is our maximum file size.',
    suggestion: 'Try a smaller image, or use your phone\'s photo editor to reduce the file size.',
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.FILE,
    isRetryable: true,
    icon: 'file-x'
  },
  FILE_TOO_SMALL: {
    title: 'Image Too Small',
    description: 'This image is too small for us to analyze properly.',
    suggestion: 'Use a higher resolution photo. Standard phone photos (at least 640x480) work best.',
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.FILE,
    isRetryable: true,
    icon: 'file-x'
  },
  INVALID_IMAGE: {
    title: 'Invalid Image',
    description: 'This doesn\'t appear to be a valid image file, or it may be corrupted.',
    suggestion: 'Try uploading a different photo. Make sure it\'s a real image file, not a renamed document.',
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.FILE,
    isRetryable: true,
    icon: 'file-x'
  },
  INVALID_INPUT: {
    title: 'Missing Information',
    description: 'We didn\'t receive everything needed to complete this request.',
    suggestion: 'Please try again and make sure the image is fully uploaded.',
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.VALIDATION,
    isRetryable: true,
    icon: 'alert-circle'
  },
  VALIDATION_FAILED: {
    title: 'Invalid Upload',
    description: 'Your image didn\'t pass our validation checks.',
    suggestion: 'Please try a different photo that is clear, well-lit, and in a supported format.',
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.VALIDATION,
    isRetryable: true,
    icon: 'file-x'
  },

  // Visualization errors
  NO_IMAGE_GENERATED: {
    title: 'Visualization Failed',
    description: 'The AI couldn\'t generate a visualization for this room. Some room types are harder to process.',
    suggestion: 'Try analyzing a different photo, or skip the visualization and follow the text recommendations.',
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.API,
    isRetryable: true,
    icon: 'help-circle'
  },
  VISUALIZATION_FAILED: {
    title: 'Couldn\'t Create Preview',
    description: 'We had trouble generating the "after" preview of your organized room.',
    suggestion: 'You can still use the text recommendations! Try the visualization again, or use a different photo.',
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.API,
    isRetryable: true,
    icon: 'help-circle'
  },

  // Processing errors
  PROCESSING_ERROR: {
    title: 'Processing Failed',
    description: 'Something went wrong while we were processing your image.',
    suggestion: 'Please try again. If this keeps happening, try a different image.',
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.UNKNOWN,
    isRetryable: true,
    icon: 'alert-circle'
  },

  // Unknown/fallback
  UNKNOWN: {
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred. We\'re not sure what happened.',
    suggestion: 'Please try again. If this keeps happening, try refreshing the page or using a different browser.',
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.UNKNOWN,
    isRetryable: true,
    icon: 'alert-circle'
  }
};

/**
 * Get a user-friendly error message for an error code
 */
export function getErrorMessage(code: string): UserErrorMessage {
  return errorMessages[code] ?? errorMessages.UNKNOWN!;
}

/**
 * Get all error codes for a specific category
 */
export function getErrorsByCategory(category: ErrorCategory): string[] {
  return Object.entries(errorMessages)
    .filter(([_, msg]) => msg.category === category)
    .map(([code, _]) => code);
}

/**
 * Create a custom error message (for dynamic errors)
 */
export function createErrorMessage(
  title: string,
  description: string,
  options: Partial<Omit<UserErrorMessage, 'title' | 'description'>> = {}
): UserErrorMessage {
  return {
    title,
    description,
    suggestion: options.suggestion || 'Please try again or contact support if this persists.',
    severity: options.severity || ErrorSeverity.ERROR,
    category: options.category || ErrorCategory.UNKNOWN,
    isRetryable: options.isRetryable ?? true,
    icon: options.icon || 'alert-circle',
    technicalDetail: options.technicalDetail,
    retryAfterSeconds: options.retryAfterSeconds
  };
}

/**
 * Format a wait time for display
 */
export function formatWaitTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Check if an error should show a countdown
 */
export function shouldShowCountdown(error: UserErrorMessage): boolean {
  return error.isRetryable && 
         error.retryAfterSeconds !== undefined && 
         error.retryAfterSeconds > 0;
}
