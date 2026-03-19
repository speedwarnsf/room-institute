/**
 * Tests for LazyImage component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { LazyImage } from '../../components/LazyImage';

// Store the callback to trigger later
let observerCallback: IntersectionObserverCallback;
let observerOptions: IntersectionObserverInit | undefined;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockUnobserve = vi.fn();

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    observerCallback = callback;
    observerOptions = options;
    this.rootMargin = options?.rootMargin || '0px';
    this.thresholds = options?.threshold ? 
      (Array.isArray(options.threshold) ? options.threshold : [options.threshold]) : 
      [0];
  }

  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = mockUnobserve;
  takeRecords = vi.fn(() => []);
}

// Helper to simulate intersection
const simulateIntersection = (isIntersecting: boolean) => {
  act(() => {
    observerCallback(
      [{ isIntersecting } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );
  });
};

describe('LazyImage', () => {
  beforeEach(() => {
    mockObserve.mockClear();
    mockDisconnect.mockClear();
    mockUnobserve.mockClear();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Rendering', () => {
    it('renders with required props', () => {
      render(<LazyImage src="test.jpg" alt="Test image" />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <LazyImage 
          src="test.jpg" 
          alt="Test image" 
          className="custom-class" 
        />
      );
      expect(screen.getByRole('img')).toHaveClass('custom-class');
    });

    it('passes additional props to img element', () => {
      render(
        <LazyImage 
          src="test.jpg" 
          alt="Test image" 
          width={200}
          height={150}
        />
      );
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('width', '200');
      expect(img).toHaveAttribute('height', '150');
    });
  });

  describe('Lazy Loading', () => {
    it('shows placeholder initially when not in view', () => {
      render(
        <LazyImage 
          src="real.jpg" 
          alt="Test" 
          placeholder="placeholder.svg"
        />
      );

      const img = screen.getByRole('img');
      // Before intersection, should show placeholder
      expect(img).toHaveAttribute('src', 'placeholder.svg');
    });

    it('loads real image when in view', async () => {
      render(<LazyImage src="real.jpg" alt="Test" />);

      // Simulate coming into view
      simulateIntersection(true);

      await waitFor(() => {
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', 'real.jpg');
      });
    });
  });

  describe('Accessibility', () => {
    it('has alt text', () => {
      render(<LazyImage src="test.jpg" alt="Descriptive alt text" />);
      expect(screen.getByAltText('Descriptive alt text')).toBeInTheDocument();
    });
  });

  describe('Loading Animation', () => {
    it('has opacity transition class', () => {
      render(<LazyImage src="test.jpg" alt="Test" />);
      const img = screen.getByRole('img');
      expect(img).toHaveClass('transition-opacity');
    });

    it('starts with opacity-0', () => {
      render(<LazyImage src="test.jpg" alt="Test" />);
      const img = screen.getByRole('img');
      expect(img).toHaveClass('opacity-0');
    });

    it('becomes visible after load', async () => {
      render(<LazyImage src="test.jpg" alt="Test" />);
      
      // Trigger intersection
      simulateIntersection(true);
      
      const img = screen.getByRole('img');
      
      // Simulate image load
      fireEvent.load(img);
      
      await waitFor(() => {
        expect(img).toHaveClass('opacity-100');
      });
    });
  });

  describe('IntersectionObserver config', () => {
    it('uses provided threshold', () => {
      render(
        <LazyImage 
          src="test.jpg" 
          alt="Test" 
          threshold={0.5}
        />
      );

      expect(observerOptions?.threshold).toBe(0.5);
    });

    it('uses provided rootMargin', () => {
      render(
        <LazyImage 
          src="test.jpg" 
          alt="Test" 
          rootMargin="200px"
        />
      );

      expect(observerOptions?.rootMargin).toBe('200px');
    });

    it('observes the image element', () => {
      render(<LazyImage src="test.jpg" alt="Test" />);
      expect(mockObserve).toHaveBeenCalled();
    });

    it('disconnects on unmount', () => {
      const { unmount } = render(<LazyImage src="test.jpg" alt="Test" />);
      unmount();
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('disconnects after intersection', () => {
      render(<LazyImage src="test.jpg" alt="Test" />);
      
      // Trigger intersection
      simulateIntersection(true);
      
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });
});
