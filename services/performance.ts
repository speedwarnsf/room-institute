/**
 * Performance Monitoring Utilities for ZenSpace
 * 
 * Provides tools for measuring and tracking performance metrics including:
 * - Image compression timing
 * - API response times
 * - Component render times
 * - Resource loading metrics
 */

/**
 * Performance metric entry
 */
export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Image processing performance data
 */
export interface ImagePerformanceData {
  /** Original file size in bytes */
  originalSize: number;
  /** Compressed file size in bytes */
  compressedSize: number;
  /** Time to compress in milliseconds */
  compressionTimeMs: number;
  /** Time to load image in milliseconds */
  loadTimeMs: number;
  /** Compression ratio (0-1) */
  compressionRatio: number;
  /** Original dimensions */
  originalDimensions: { width: number; height: number };
  /** Final dimensions */
  finalDimensions: { width: number; height: number };
}

/**
 * API call performance data
 */
export interface ApiPerformanceData {
  /** Endpoint or operation name */
  endpoint: string;
  /** Request start time */
  startTime: number;
  /** Total duration in milliseconds */
  durationMs: number;
  /** HTTP status code (if applicable) */
  status?: number;
  /** Whether the request was successful */
  success: boolean;
  /** Response size in bytes (if available) */
  responseSize?: number;
  /** Number of retries (if any) */
  retries?: number;
}

/**
 * Render performance data
 */
export interface RenderPerformanceData {
  /** Component name */
  component: string;
  /** Render duration in milliseconds */
  durationMs: number;
  /** Whether this was a re-render */
  isRerender: boolean;
  /** Props that triggered render (for debugging) */
  triggerProps?: string[];
}

/**
 * Performance thresholds for warnings
 */
export const PERFORMANCE_THRESHOLDS = {
  /** Image compression should complete within 3 seconds */
  IMAGE_COMPRESSION_MS: 3000,
  /** API calls should complete within 30 seconds */
  API_CALL_MS: 30000,
  /** Analysis should complete within 60 seconds */
  ANALYSIS_MS: 60000,
  /** Visualization should complete within 90 seconds */
  VISUALIZATION_MS: 90000,
  /** Component renders should be under 16ms for 60fps */
  RENDER_MS: 16,
  /** Image load should be under 2 seconds */
  IMAGE_LOAD_MS: 2000,
};

/**
 * Simple performance timer class
 */
export class PerformanceTimer {
  private timers: Map<string, number> = new Map();
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 100;

  /**
   * Start timing an operation
   */
  start(name: string): void {
    this.timers.set(name, performance.now());
  }

  /**
   * End timing and get duration
   */
  end(name: string, metadata?: Record<string, unknown>): number | null {
    const startTime = this.timers.get(name);
    if (startTime === undefined) {
      console.warn(`[Performance] No timer started for: ${name}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    this.timers.delete(name);

    // Store metric
    const metric: PerformanceMetric = {
      name,
      startTime,
      endTime,
      duration,
      metadata,
    };
    this.metrics.push(metric);

    // Trim old metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    return duration;
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name pattern
   */
  getMetricsByName(pattern: string | RegExp): PerformanceMetric[] {
    return this.metrics.filter(m => {
      if (typeof pattern === 'string') {
        return m.name.includes(pattern);
      }
      return pattern.test(m.name);
    });
  }

  /**
   * Get average duration for a metric type
   */
  getAverageDuration(name: string): number | null {
    const matching = this.metrics.filter(m => m.name === name && m.duration !== undefined);
    if (matching.length === 0) return null;
    const total = matching.reduce((sum, m) => sum + (m.duration || 0), 0);
    return total / matching.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.timers.clear();
    this.metrics = [];
  }
}

// Singleton instance
export const performanceTimer = new PerformanceTimer();

/**
 * Measure an async operation
 */
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<{ result: T; durationMs: number }> {
  performanceTimer.start(name);
  try {
    const result = await operation();
    const durationMs = performanceTimer.end(name, metadata) ?? 0;
    return { result, durationMs };
  } catch (error) {
    performanceTimer.end(name, { ...metadata, error: true });
    throw error;
  }
}

/**
 * Measure a sync operation
 */
export function measureSync<T>(
  name: string,
  operation: () => T,
  metadata?: Record<string, unknown>
): { result: T; durationMs: number } {
  performanceTimer.start(name);
  try {
    const result = operation();
    const durationMs = performanceTimer.end(name, metadata) ?? 0;
    return { result, durationMs };
  } catch (error) {
    performanceTimer.end(name, { ...metadata, error: true });
    throw error;
  }
}

/**
 * Check if a metric exceeds its threshold
 */
export function exceedsThreshold(
  metricType: keyof typeof PERFORMANCE_THRESHOLDS,
  durationMs: number
): boolean {
  return durationMs > PERFORMANCE_THRESHOLDS[metricType];
}

/**
 * Get a performance report for the session
 */
export function getPerformanceReport(): {
  metrics: PerformanceMetric[];
  summary: Record<string, { count: number; avgMs: number; maxMs: number; minMs: number }>;
  warnings: string[];
} {
  const metrics = performanceTimer.getMetrics();
  const warnings: string[] = [];
  
  // Group by name and calculate stats
  const grouped = new Map<string, number[]>();
  metrics.forEach(m => {
    if (m.duration === undefined) return;
    const list = grouped.get(m.name) || [];
    list.push(m.duration);
    grouped.set(m.name, list);
  });

  const summary: Record<string, { count: number; avgMs: number; maxMs: number; minMs: number }> = {};
  grouped.forEach((durations, name) => {
    const count = durations.length;
    const avgMs = durations.reduce((a, b) => a + b, 0) / count;
    const maxMs = Math.max(...durations);
    const minMs = Math.min(...durations);
    summary[name] = { count, avgMs, maxMs, minMs };

    // Check for slow operations
    if (name.includes('compression') && avgMs > PERFORMANCE_THRESHOLDS.IMAGE_COMPRESSION_MS) {
      warnings.push(`Image compression averaging ${avgMs.toFixed(0)}ms (threshold: ${PERFORMANCE_THRESHOLDS.IMAGE_COMPRESSION_MS}ms)`);
    }
    if (name.includes('analysis') && avgMs > PERFORMANCE_THRESHOLDS.ANALYSIS_MS) {
      warnings.push(`Analysis averaging ${avgMs.toFixed(0)}ms (threshold: ${PERFORMANCE_THRESHOLDS.ANALYSIS_MS}ms)`);
    }
    if (name.includes('render') && avgMs > PERFORMANCE_THRESHOLDS.RENDER_MS) {
      warnings.push(`Render for ${name} averaging ${avgMs.toFixed(0)}ms (threshold: ${PERFORMANCE_THRESHOLDS.RENDER_MS}ms)`);
    }
  });

  return { metrics, summary, warnings };
}

/**
 * Format a duration for display
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

/**
 * Debounce render measurements to avoid performance overhead
 */
export function createRenderTracker(componentName: string) {
  let lastRenderTime = 0;
  let renderCount = 0;

  return {
    onRender(): void {
      const now = performance.now();
      if (lastRenderTime > 0) {
        const timeSinceLastRender = now - lastRenderTime;
        // Only log if re-renders are happening too quickly (< 100ms apart)
        if (timeSinceLastRender < 100 && renderCount > 2) {
          console.warn(`[Performance] ${componentName} re-rendering rapidly (${renderCount} renders in ${timeSinceLastRender.toFixed(0)}ms)`);
        }
      }
      lastRenderTime = now;
      renderCount++;
    },
    reset(): void {
      lastRenderTime = 0;
      renderCount = 0;
    },
  };
}

/**
 * Measure image loading performance
 */
export function measureImageLoad(
  src: string,
  onComplete: (data: { loadTimeMs: number; width: number; height: number }) => void
): void {
  const start = performance.now();
  const img = new Image();
  
  img.onload = () => {
    const loadTimeMs = performance.now() - start;
    onComplete({
      loadTimeMs,
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  };
  
  img.onerror = () => {
    const loadTimeMs = performance.now() - start;
    console.warn(`[Performance] Image failed to load: ${src} (after ${loadTimeMs.toFixed(0)}ms)`);
  };
  
  img.src = src;
}

/**
 * Get Web Vitals if available
 */
export function getWebVitals(): {
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
} | null {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  const navEntry = entries[0];

  return {
    ttfb: navEntry?.responseStart ? navEntry.responseStart - navEntry.requestStart : undefined,
    // Note: LCP, FID, CLS require PerformanceObserver - these are placeholders
  };
}
