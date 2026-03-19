/**
 * Analytics and Telemetry Hooks for Room
 * 
 * This module provides hooks for analytics/telemetry without implementing
 * any actual service. It's designed for easy integration with services like:
 * - Google Analytics
 * - Mixpanel
 * - PostHog
 * - Custom analytics backends
 * 
 * Usage:
 *   import { analytics } from './services/analytics';
 *   analytics.track('image_uploaded', { size: 1024000, mimeType: 'image/jpeg' });
 */

/**
 * Event types that can be tracked
 */
export type AnalyticsEventType =
  // Image events
  | 'image_uploaded'
  | 'image_compressed'
  | 'image_rejected'
  // Analysis events
  | 'analysis_started'
  | 'analysis_completed'
  | 'analysis_failed'
  | 'analysis_retry'
  // Visualization events
  | 'visualization_started'
  | 'visualization_completed'
  | 'visualization_failed'
  // Chat events
  | 'chat_message_sent'
  | 'chat_session_started'
  // Product events
  | 'product_link_clicked'
  | 'product_suggestions_shown'
  // Session events
  | 'session_saved'
  | 'session_loaded'
  | 'session_shared'
  // UI events
  | 'theme_changed'
  | 'comparison_slider_used'
  | 'image_zoom_used'
  // Error events
  | 'error_displayed'
  | 'error_dismissed'
  // Network events
  | 'network_status_changed'
  // Performance events
  | 'perf_image_load'
  | 'perf_api_call'
  | 'perf_render';

/**
 * Properties that can be attached to events
 */
export interface EventProperties {
  // Image properties
  imageSize?: number;
  imageMimeType?: string;
  imageWidth?: number;
  imageHeight?: number;
  compressionRatio?: number;
  // Analysis properties
  analysisModel?: string;
  analysisLatencyMs?: number;
  productCount?: number;
  // Error properties
  errorCode?: string;
  errorMessage?: string;
  isRetryable?: boolean;
  // Performance properties
  durationMs?: number;
  componentName?: string;
  // UI properties
  theme?: 'light' | 'dark' | 'system';
  source?: string;
  // Generic
  [key: string]: unknown;
}

/**
 * User properties for identification
 */
export interface UserProperties {
  sessionId?: string;
  userAgent?: string;
  language?: string;
  timezone?: string;
  screenSize?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  [key: string]: unknown;
}

/**
 * Performance timing entry
 */
export interface PerformanceTiming {
  name: string;
  startTime: number;
  duration: number;
  metadata?: Record<string, unknown>;
}

/**
 * Analytics adapter interface for implementing custom backends
 */
export interface AnalyticsAdapter {
  track(event: AnalyticsEventType, properties?: EventProperties): void;
  identify(userId: string, properties?: UserProperties): void;
  page(name: string, properties?: Record<string, unknown>): void;
  timing(timing: PerformanceTiming): void;
}

/**
 * Console adapter for development - logs all events to console
 */
class ConsoleAdapter implements AnalyticsAdapter {
  private enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  track(event: AnalyticsEventType, properties?: EventProperties): void {
    if (this.enabled && process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event, properties);
    }
  }

  identify(userId: string, properties?: UserProperties): void {
    if (this.enabled && process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Identify:', userId, properties);
    }
  }

  page(name: string, properties?: Record<string, unknown>): void {
    if (this.enabled && process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Page:', name, properties);
    }
  }

  timing(timing: PerformanceTiming): void {
    if (this.enabled && process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Timing:', timing.name, `${timing.duration}ms`, timing.metadata);
    }
  }
}

/**
 * No-op adapter for when analytics is disabled
 */
class NoOpAdapter implements AnalyticsAdapter {
  track(): void {}
  identify(): void {}
  page(): void {}
  timing(): void {}
}

/**
 * Main analytics class that delegates to adapters
 */
class Analytics {
  private adapters: AnalyticsAdapter[] = [];
  private sessionId: string;
  private timings: Map<string, number> = new Map();

  constructor() {
    this.sessionId = this.generateSessionId();
    // Default to console adapter in development
    if (process.env.NODE_ENV === 'development') {
      this.adapters.push(new ConsoleAdapter(false)); // Disabled by default to reduce noise
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Add an analytics adapter
   */
  addAdapter(adapter: AnalyticsAdapter): void {
    this.adapters.push(adapter);
  }

  /**
   * Remove all adapters
   */
  clearAdapters(): void {
    this.adapters = [];
  }

  /**
   * Track an event
   */
  track(event: AnalyticsEventType, properties?: EventProperties): void {
    const enrichedProperties = {
      ...properties,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };

    this.adapters.forEach(adapter => {
      try {
        adapter.track(event, enrichedProperties);
      } catch (e) {
        console.error('[Analytics] Adapter error:', e);
      }
    });
  }

  /**
   * Identify a user
   */
  identify(userId: string, properties?: UserProperties): void {
    const enrichedProperties = {
      ...properties,
      sessionId: this.sessionId,
    };

    this.adapters.forEach(adapter => {
      try {
        adapter.identify(userId, enrichedProperties);
      } catch (e) {
        console.error('[Analytics] Adapter error:', e);
      }
    });
  }

  /**
   * Track a page view
   */
  page(name: string, properties?: Record<string, unknown>): void {
    this.adapters.forEach(adapter => {
      try {
        adapter.page(name, { ...properties, sessionId: this.sessionId });
      } catch (e) {
        console.error('[Analytics] Adapter error:', e);
      }
    });
  }

  /**
   * Start a performance timing
   */
  startTiming(name: string): void {
    this.timings.set(name, performance.now());
  }

  /**
   * End a performance timing and track it
   */
  endTiming(name: string, metadata?: Record<string, unknown>): number | null {
    const startTime = this.timings.get(name);
    if (startTime === undefined) {
      console.warn(`[Analytics] No timing started for: ${name}`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.timings.delete(name);

    const timing: PerformanceTiming = {
      name,
      startTime,
      duration,
      metadata,
    };

    this.adapters.forEach(adapter => {
      try {
        adapter.timing(timing);
      } catch (e) {
        console.error('[Analytics] Adapter error:', e);
      }
    });

    return duration;
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  // ============================================
  // Convenience methods for common events
  // ============================================

  /**
   * Track image upload
   */
  trackImageUpload(file: File): void {
    this.track('image_uploaded', {
      imageSize: file.size,
      imageMimeType: file.type,
    });
  }

  /**
   * Track image compression
   */
  trackImageCompression(
    originalSize: number,
    compressedSize: number,
    width: number,
    height: number
  ): void {
    this.track('image_compressed', {
      imageSize: compressedSize,
      compressionRatio: compressedSize / originalSize,
      imageWidth: width,
      imageHeight: height,
    });
  }

  /**
   * Track analysis start
   */
  trackAnalysisStart(): void {
    this.startTiming('analysis');
    this.track('analysis_started');
  }

  /**
   * Track analysis completion
   */
  trackAnalysisComplete(productCount: number): void {
    const duration = this.endTiming('analysis');
    this.track('analysis_completed', {
      productCount,
      analysisLatencyMs: duration ?? undefined,
    });
  }

  /**
   * Track analysis failure
   */
  trackAnalysisFailure(errorCode: string, errorMessage: string, isRetryable: boolean): void {
    this.endTiming('analysis');
    this.track('analysis_failed', {
      errorCode,
      errorMessage,
      isRetryable,
    });
  }

  /**
   * Track error display
   */
  trackError(code: string, message: string, isRetryable: boolean): void {
    this.track('error_displayed', {
      errorCode: code,
      errorMessage: message,
      isRetryable,
    });
  }

  /**
   * Track theme change
   */
  trackThemeChange(theme: 'light' | 'dark' | 'system'): void {
    this.track('theme_changed', { theme });
  }

  /**
   * Track product link click
   */
  trackProductClick(productName: string, _searchTerm: string): void {
    this.track('product_link_clicked', {
      source: productName,
      // Don't include searchTerm in analytics to avoid PII/tracking issues
    });
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Export classes for testing and custom implementations
export { Analytics, ConsoleAdapter, NoOpAdapter };
