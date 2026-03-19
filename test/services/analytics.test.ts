/**
 * Analytics Service Tests
 * 
 * Tests for the analytics hooks and adapters
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  Analytics, 
  ConsoleAdapter, 
  NoOpAdapter,
  type AnalyticsAdapter,
  type AnalyticsEventType,
  type EventProperties 
} from '../../services/analytics';

describe('Analytics Service', () => {
  describe('Analytics Class', () => {
    let analytics: Analytics;

    beforeEach(() => {
      analytics = new Analytics();
      analytics.clearAdapters();
    });

    it('generates a unique session ID', () => {
      const analytics1 = new Analytics();
      const analytics2 = new Analytics();
      
      expect(analytics1.getSessionId()).toBeDefined();
      expect(analytics2.getSessionId()).toBeDefined();
      expect(analytics1.getSessionId()).not.toBe(analytics2.getSessionId());
    });

    it('session ID has correct format', () => {
      const sessionId = analytics.getSessionId();
      // Format: timestamp-randomString
      expect(sessionId).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('tracks events to all adapters', () => {
      const mockAdapter1: AnalyticsAdapter = {
        track: vi.fn(),
        identify: vi.fn(),
        page: vi.fn(),
        timing: vi.fn(),
      };
      const mockAdapter2: AnalyticsAdapter = {
        track: vi.fn(),
        identify: vi.fn(),
        page: vi.fn(),
        timing: vi.fn(),
      };

      analytics.addAdapter(mockAdapter1);
      analytics.addAdapter(mockAdapter2);

      analytics.track('image_uploaded', { imageSize: 1000 });

      expect(mockAdapter1.track).toHaveBeenCalledTimes(1);
      expect(mockAdapter2.track).toHaveBeenCalledTimes(1);
    });

    it('enriches events with sessionId and timestamp', () => {
      const mockAdapter: AnalyticsAdapter = {
        track: vi.fn(),
        identify: vi.fn(),
        page: vi.fn(),
        timing: vi.fn(),
      };

      analytics.addAdapter(mockAdapter);
      analytics.track('analysis_started');

      const call = (mockAdapter.track as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[1]).toHaveProperty('sessionId');
      expect(call[1]).toHaveProperty('timestamp');
      expect(call[1].sessionId).toBe(analytics.getSessionId());
    });

    it('handles adapter errors gracefully', () => {
      const errorAdapter: AnalyticsAdapter = {
        track: vi.fn().mockImplementation(() => {
          throw new Error('Adapter failed');
        }),
        identify: vi.fn(),
        page: vi.fn(),
        timing: vi.fn(),
      };
      const workingAdapter: AnalyticsAdapter = {
        track: vi.fn(),
        identify: vi.fn(),
        page: vi.fn(),
        timing: vi.fn(),
      };

      analytics.addAdapter(errorAdapter);
      analytics.addAdapter(workingAdapter);

      // Should not throw
      expect(() => analytics.track('analysis_started')).not.toThrow();
      // Working adapter should still be called
      expect(workingAdapter.track).toHaveBeenCalled();
    });

    it('clears all adapters', () => {
      const mockAdapter: AnalyticsAdapter = {
        track: vi.fn(),
        identify: vi.fn(),
        page: vi.fn(),
        timing: vi.fn(),
      };

      analytics.addAdapter(mockAdapter);
      analytics.clearAdapters();
      analytics.track('image_uploaded');

      expect(mockAdapter.track).not.toHaveBeenCalled();
    });
  });

  describe('Identify', () => {
    it('calls identify on all adapters', () => {
      const analytics = new Analytics();
      analytics.clearAdapters();

      const mockAdapter: AnalyticsAdapter = {
        track: vi.fn(),
        identify: vi.fn(),
        page: vi.fn(),
        timing: vi.fn(),
      };

      analytics.addAdapter(mockAdapter);
      analytics.identify('user-123', { language: 'en' });

      expect(mockAdapter.identify).toHaveBeenCalledWith('user-123', expect.objectContaining({
        language: 'en',
        sessionId: analytics.getSessionId(),
      }));
    });
  });

  describe('Page Tracking', () => {
    it('tracks page views', () => {
      const analytics = new Analytics();
      analytics.clearAdapters();

      const mockAdapter: AnalyticsAdapter = {
        track: vi.fn(),
        identify: vi.fn(),
        page: vi.fn(),
        timing: vi.fn(),
      };

      analytics.addAdapter(mockAdapter);
      analytics.page('Home', { referrer: 'google' });

      expect(mockAdapter.page).toHaveBeenCalledWith('Home', expect.objectContaining({
        referrer: 'google',
        sessionId: analytics.getSessionId(),
      }));
    });
  });

  describe('Performance Timing', () => {
    let analytics: Analytics;

    beforeEach(() => {
      analytics = new Analytics();
      analytics.clearAdapters();
    });

    it('tracks timing between start and end', async () => {
      const mockAdapter: AnalyticsAdapter = {
        track: vi.fn(),
        identify: vi.fn(),
        page: vi.fn(),
        timing: vi.fn(),
      };

      analytics.addAdapter(mockAdapter);
      analytics.startTiming('test-operation');
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const duration = analytics.endTiming('test-operation');

      expect(duration).toBeGreaterThan(0);
      expect(mockAdapter.timing).toHaveBeenCalledWith(expect.objectContaining({
        name: 'test-operation',
        duration: expect.any(Number),
      }));
    });

    it('returns null for non-existent timing', () => {
      const duration = analytics.endTiming('non-existent');
      expect(duration).toBeNull();
    });

    it('includes metadata in timing', () => {
      const mockAdapter: AnalyticsAdapter = {
        track: vi.fn(),
        identify: vi.fn(),
        page: vi.fn(),
        timing: vi.fn(),
      };

      analytics.addAdapter(mockAdapter);
      analytics.startTiming('api-call');
      analytics.endTiming('api-call', { endpoint: '/analyze' });

      expect(mockAdapter.timing).toHaveBeenCalledWith(expect.objectContaining({
        metadata: { endpoint: '/analyze' },
      }));
    });

    it('cleans up timing after end', () => {
      analytics.startTiming('cleanup-test');
      analytics.endTiming('cleanup-test');
      
      // Second end should return null
      const result = analytics.endTiming('cleanup-test');
      expect(result).toBeNull();
    });
  });

  describe('Convenience Methods', () => {
    let analytics: Analytics;
    let mockAdapter: AnalyticsAdapter;

    beforeEach(() => {
      analytics = new Analytics();
      analytics.clearAdapters();
      mockAdapter = {
        track: vi.fn(),
        identify: vi.fn(),
        page: vi.fn(),
        timing: vi.fn(),
      };
      analytics.addAdapter(mockAdapter);
    });

    it('trackImageUpload sends correct properties', () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 1024000 });

      analytics.trackImageUpload(mockFile);

      expect(mockAdapter.track).toHaveBeenCalledWith('image_uploaded', expect.objectContaining({
        imageSize: 1024000,
        imageMimeType: 'image/jpeg',
      }));
    });

    it('trackImageCompression calculates ratio', () => {
      analytics.trackImageCompression(1000000, 250000, 1920, 1080);

      expect(mockAdapter.track).toHaveBeenCalledWith('image_compressed', expect.objectContaining({
        imageSize: 250000,
        compressionRatio: 0.25,
        imageWidth: 1920,
        imageHeight: 1080,
      }));
    });

    it('trackAnalysisStart starts timing', () => {
      analytics.trackAnalysisStart();

      expect(mockAdapter.track).toHaveBeenCalledWith('analysis_started', expect.anything());
    });

    it('trackAnalysisComplete includes duration', async () => {
      analytics.trackAnalysisStart();
      await new Promise(resolve => setTimeout(resolve, 5));
      analytics.trackAnalysisComplete(3);

      expect(mockAdapter.track).toHaveBeenCalledWith('analysis_completed', expect.objectContaining({
        productCount: 3,
      }));
    });

    it('trackAnalysisFailure includes error details', () => {
      analytics.trackAnalysisStart();
      analytics.trackAnalysisFailure('NETWORK_ERROR', 'Connection failed', true);

      expect(mockAdapter.track).toHaveBeenCalledWith('analysis_failed', expect.objectContaining({
        errorCode: 'NETWORK_ERROR',
        errorMessage: 'Connection failed',
        isRetryable: true,
      }));
    });

    it('trackError sends error event', () => {
      analytics.trackError('RATE_LIMIT', 'Too many requests', true);

      expect(mockAdapter.track).toHaveBeenCalledWith('error_displayed', expect.objectContaining({
        errorCode: 'RATE_LIMIT',
        isRetryable: true,
      }));
    });

    it('trackThemeChange includes theme', () => {
      analytics.trackThemeChange('dark');

      expect(mockAdapter.track).toHaveBeenCalledWith('theme_changed', expect.objectContaining({
        theme: 'dark',
      }));
    });

    it('trackProductClick includes product name', () => {
      analytics.trackProductClick('Storage Basket', 'woven storage basket');

      expect(mockAdapter.track).toHaveBeenCalledWith('product_link_clicked', expect.objectContaining({
        source: 'Storage Basket',
      }));
    });
  });

  describe('ConsoleAdapter', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('logs to console when enabled in development', () => {
      const adapter = new ConsoleAdapter(true);
      adapter.track('image_uploaded', { imageSize: 1000 });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics]',
        'image_uploaded',
        { imageSize: 1000 }
      );
    });

    it('does not log when disabled', () => {
      const adapter = new ConsoleAdapter(false);
      adapter.track('image_uploaded');

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('logs identify calls', () => {
      const adapter = new ConsoleAdapter(true);
      adapter.identify('user-123', { language: 'en' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] Identify:',
        'user-123',
        { language: 'en' }
      );
    });

    it('logs page calls', () => {
      const adapter = new ConsoleAdapter(true);
      adapter.page('Results', { products: 5 });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] Page:',
        'Results',
        { products: 5 }
      );
    });

    it('logs timing calls', () => {
      const adapter = new ConsoleAdapter(true);
      adapter.timing({ name: 'api-call', startTime: 0, duration: 150, metadata: { endpoint: '/analyze' } });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] Timing:',
        'api-call',
        '150ms',
        { endpoint: '/analyze' }
      );
    });
  });

  describe('NoOpAdapter', () => {
    it('does nothing on track', () => {
      const adapter = new NoOpAdapter();
      expect(() => adapter.track('image_uploaded')).not.toThrow();
    });

    it('does nothing on identify', () => {
      const adapter = new NoOpAdapter();
      expect(() => adapter.identify('user')).not.toThrow();
    });

    it('does nothing on page', () => {
      const adapter = new NoOpAdapter();
      expect(() => adapter.page('Home')).not.toThrow();
    });

    it('does nothing on timing', () => {
      const adapter = new NoOpAdapter();
      expect(() => adapter.timing({ name: 'test', startTime: 0, duration: 100 })).not.toThrow();
    });
  });

  describe('Event Types', () => {
    const eventTypes: AnalyticsEventType[] = [
      'image_uploaded',
      'image_compressed',
      'image_rejected',
      'analysis_started',
      'analysis_completed',
      'analysis_failed',
      'analysis_retry',
      'visualization_started',
      'visualization_completed',
      'visualization_failed',
      'chat_message_sent',
      'chat_session_started',
      'product_link_clicked',
      'product_suggestions_shown',
      'session_saved',
      'session_loaded',
      'session_shared',
      'theme_changed',
      'comparison_slider_used',
      'image_zoom_used',
      'error_displayed',
      'error_dismissed',
      'perf_image_load',
      'perf_api_call',
      'perf_render',
    ];

    it('supports all defined event types', () => {
      const analytics = new Analytics();
      analytics.clearAdapters();
      
      const mockAdapter: AnalyticsAdapter = {
        track: vi.fn(),
        identify: vi.fn(),
        page: vi.fn(),
        timing: vi.fn(),
      };
      analytics.addAdapter(mockAdapter);

      eventTypes.forEach(eventType => {
        expect(() => analytics.track(eventType)).not.toThrow();
      });

      expect(mockAdapter.track).toHaveBeenCalledTimes(eventTypes.length);
    });
  });
});
