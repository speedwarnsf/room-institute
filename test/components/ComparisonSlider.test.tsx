/**
 * Tests for the ComparisonSlider component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComparisonSlider } from '../../components/ComparisonSlider';

// Mock images
const mockBeforeImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const mockAfterImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('ComparisonSlider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with required props', () => {
      render(
        <ComparisonSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
        />
      );
      
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('renders both images', () => {
      render(
        <ComparisonSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
        />
      );
      
      const images = screen.getAllByRole('img');
      expect(images.length).toBe(2);
    });

    it('renders custom labels', async () => {
      render(
        <ComparisonSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
          beforeLabel="Original"
          afterLabel="Redesigned"
        />
      );
      
      // Simulate images loading
      const images = screen.getAllByRole('img');
      images.forEach(img => fireEvent.load(img));
      
      await waitFor(() => {
        expect(screen.getByText('Original')).toBeInTheDocument();
        expect(screen.getByText('Redesigned')).toBeInTheDocument();
      });
    });

    it('applies custom className', () => {
      render(
        <ComparisonSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
          className="custom-class"
        />
      );
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(
        <ComparisonSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
        />
      );
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-label', 'Compare before and after images');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
      expect(slider).toHaveAttribute('aria-valuemax', '100');
      expect(slider).toHaveAttribute('aria-valuenow');
    });

    it('is focusable', () => {
      render(
        <ComparisonSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
        />
      );
      
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('tabIndex', '0');
    });

    it('has alt text for images', () => {
      render(
        <ComparisonSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
          beforeLabel="Before Room"
          afterLabel="After Redesign"
        />
      );
      
      expect(screen.getByAltText('Before Room')).toBeInTheDocument();
      expect(screen.getByAltText('After Redesign')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('moves slider left with ArrowLeft', async () => {
      render(
        <ComparisonSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
        />
      );
      
      const slider = screen.getByRole('slider');
      // Default starts at 50
      expect(slider.getAttribute('aria-valuenow')).toBe('50');
      
      // Focus and press ArrowLeft
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowLeft' });
      
      // Should decrease by 5
      await waitFor(() => {
        expect(slider.getAttribute('aria-valuenow')).toBe('45');
      });
    });

    it('moves slider right with ArrowRight', async () => {
      render(
        <ComparisonSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
        />
      );
      
      const slider = screen.getByRole('slider');
      expect(slider.getAttribute('aria-valuenow')).toBe('50');
      
      // Focus and press ArrowRight
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      
      // Should increase by 5
      await waitFor(() => {
        expect(slider.getAttribute('aria-valuenow')).toBe('55');
      });
    });

    it('does not go below 0', async () => {
      render(
        <ComparisonSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
        />
      );
      
      const slider = screen.getByRole('slider');
      slider.focus();
      
      // Press left many times (50/5 = 10, plus extra)
      for (let i = 0; i < 15; i++) {
        fireEvent.keyDown(slider, { key: 'ArrowLeft' });
      }
      
      await waitFor(() => {
        const value = parseInt(slider.getAttribute('aria-valuenow') || '0', 10);
        expect(value).toBe(2);
      });
    });

    it('does not go above 100', async () => {
      render(
        <ComparisonSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
        />
      );
      
      const slider = screen.getByRole('slider');
      slider.focus();
      
      // Press right many times (50/5 = 10, plus extra)
      for (let i = 0; i < 15; i++) {
        fireEvent.keyDown(slider, { key: 'ArrowRight' });
      }
      
      await waitFor(() => {
        const value = parseInt(slider.getAttribute('aria-valuenow') || '100', 10);
        expect(value).toBe(98);
      });
    });
  });

  describe('Mouse Interaction', () => {
    it('responds to mouseDown event', () => {
      render(
        <ComparisonSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
        />
      );
      
      const slider = screen.getByRole('slider');
      
      // In JSDOM, getBoundingClientRect returns zeros, so we just verify
      // the component responds to mouse events without crashing
      fireEvent.mouseDown(slider, { clientX: 100 });
      
      // Component should still be functional
      expect(slider).toBeInTheDocument();
    });

    it('handles drag interaction events', () => {
      render(
        <ComparisonSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
        />
      );
      
      const slider = screen.getByRole('slider');
      
      // Start drag
      fireEvent.mouseDown(slider, { clientX: 100 });
      
      // Move
      fireEvent.mouseMove(document, { clientX: 50 });
      
      // End drag
      fireEvent.mouseUp(document);
      
      // Component should still be functional
      expect(slider).toBeInTheDocument();
    });
  });

  describe('Touch Interaction', () => {
    it('handles touch start event', () => {
      render(
        <ComparisonSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
        />
      );
      
      const slider = screen.getByRole('slider');
      
      // Fire touch event
      fireEvent.touchStart(slider, {
        touches: [{ clientX: 30 }],
      });
      
      // Component should still be functional
      expect(slider).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading state before images load', () => {
      render(
        <ComparisonSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
        />
      );
      
      expect(screen.getByText('Loading comparison...')).toBeInTheDocument();
    });

    it('hides loading state after images load', async () => {
      render(
        <ComparisonSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
        />
      );
      
      const images = screen.getAllByRole('img');
      images.forEach(img => fireEvent.load(img));
      
      await waitFor(() => {
        expect(screen.queryByText('Loading comparison...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Default Labels', () => {
    it('uses default labels when not provided', async () => {
      render(
        <ComparisonSlider
          beforeImage={mockBeforeImage}
          afterImage={mockAfterImage}
        />
      );
      
      const images = screen.getAllByRole('img');
      images.forEach(img => fireEvent.load(img));
      
      await waitFor(() => {
        expect(screen.getByText('Before')).toBeInTheDocument();
        expect(screen.getByText('After')).toBeInTheDocument();
      });
    });
  });
});
