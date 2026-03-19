import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ShareButton } from '../../components/ShareButton';

// Mock supabase
vi.mock('../../services/auth', () => ({
  supabase: {
    from: () => ({
      insert: () => Promise.resolve({ error: { message: 'test mode' } }),
    }),
  },
  getAnonymousId: () => 'test-anon',
  getCurrentUser: () => Promise.resolve(null),
}));

const mockAnalysis = `# Room Analysis

## Overview
Your living room has several organization opportunities. The main areas of concern are the cluttered coffee table and overflowing bookshelf.

## Recommendations
1. Clear the coffee table of non-essential items
2. Organize books by category
3. Add storage baskets for loose items
`;

describe('ShareButton', () => {
  let mockClipboardWriteText: ReturnType<typeof vi.fn>;
  let mockShare: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockClipboardWriteText = vi.fn().mockResolvedValue(undefined);
    mockShare = vi.fn().mockResolvedValue(undefined);
    
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockClipboardWriteText },
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true
    });
  });

  describe('Desktop (dropdown menu)', () => {
    it('renders share button', () => {
      render(<ShareButton analysis={mockAnalysis} />);
      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    });

    it('opens dropdown menu on click', async () => {
      render(<ShareButton analysis={mockAnalysis} />);
      
      const button = screen.getByRole('button', { name: /share/i });
      await act(async () => {
        fireEvent.click(button);
      });
      
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByText(/copy link/i)).toBeInTheDocument();
    });

    it('has aria-haspopup attribute', () => {
      render(<ShareButton analysis={mockAnalysis} />);
      const button = screen.getByRole('button', { name: /share/i });
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('updates aria-expanded when opened', async () => {
      render(<ShareButton analysis={mockAnalysis} />);
      
      const button = screen.getByRole('button', { name: /share/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      await act(async () => {
        fireEvent.click(button);
      });
      
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('copies to clipboard when copy link clicked', async () => {
      const onShare = vi.fn();
      render(<ShareButton analysis={mockAnalysis} onShare={onShare} />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /share/i }));
      });
      
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
      
      await act(async () => {
        fireEvent.click(screen.getByText(/copy link/i));
      });
      
      await waitFor(() => {
        expect(mockClipboardWriteText).toHaveBeenCalled();
      });
      
      // Falls back to room.institute when supabase insert fails
      const copiedText = mockClipboardWriteText.mock.calls[0]?.[0] as string;
      expect(copiedText).toContain('room.institute');
    });

    it('opens Twitter share in new window', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      
      render(<ShareButton analysis={mockAnalysis} />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /share/i }));
      });
      
      await act(async () => {
        fireEvent.click(screen.getByText(/share on x/i));
      });
      
      await waitFor(() => {
        expect(windowOpenSpy).toHaveBeenCalledWith(
          expect.stringContaining('twitter.com/intent/tweet'),
          '_blank',
          expect.any(String)
        );
      });
      
      windowOpenSpy.mockRestore();
    });

    it('closes menu when backdrop is clicked', async () => {
      render(<ShareButton analysis={mockAnalysis} />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /share/i }));
      });
      
      expect(screen.getByRole('menu')).toBeInTheDocument();
      
      const backdrop = document.querySelector('.fixed.inset-0');
      expect(backdrop).toBeInTheDocument();
      
      await act(async () => {
        fireEvent.click(backdrop!);
      });
      
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('extracts summary from analysis', async () => {
      render(<ShareButton analysis={mockAnalysis} />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /share/i }));
      });
      
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
      
      // Click "Copy Text" to get the full text
      await act(async () => {
        fireEvent.click(screen.getByText(/copy text/i));
      });
      
      await waitFor(() => {
        expect(mockClipboardWriteText).toHaveBeenCalled();
      });
      
      const copiedText = mockClipboardWriteText.mock.calls[0]?.[0] as string;
      expect(copiedText).toContain('living room');
    });

    it('uses room type in fallback message', async () => {
      const shortAnalysis = '# Tips';
      
      render(<ShareButton analysis={shortAnalysis} roomType="bedroom" />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /share/i }));
      });
      
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
      
      await act(async () => {
        fireEvent.click(screen.getByText(/copy text/i));
      });
      
      await waitFor(() => {
        expect(mockClipboardWriteText).toHaveBeenCalled();
      });
      
      const copiedText = mockClipboardWriteText.mock.calls[0]?.[0] as string;
      expect(copiedText).toContain('bedroom');
    });
  });

  describe('Mobile (Web Share API)', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true
      });
    });

    it('renders simple share button without dropdown', () => {
      render(<ShareButton analysis={mockAnalysis} />);
      
      const button = screen.getByRole('button', { name: /share/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toHaveAttribute('aria-haspopup');
    });

    it('calls native share API on click', async () => {
      render(<ShareButton analysis={mockAnalysis} />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /share/i }));
      });
      
      await waitFor(() => {
        expect(mockShare).toHaveBeenCalled();
      });
      
      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'My Room Room Analysis',
          url: expect.stringContaining('room.institute'),
        })
      );
    });

    it('calls onShare callback after successful share', async () => {
      const onShare = vi.fn();
      
      render(<ShareButton analysis={mockAnalysis} onShare={onShare} />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /share/i }));
      });
      
      await waitFor(() => {
        expect(onShare).toHaveBeenCalled();
      });
    });

    it('handles share cancellation gracefully', async () => {
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';
      mockShare.mockRejectedValueOnce(abortError);
      
      render(<ShareButton analysis={mockAnalysis} />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /share/i }));
      });
      
      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });
    });

    it('disables button while sharing', async () => {
      let resolveShare: (() => void) | undefined;
      mockShare.mockImplementationOnce(() => new Promise<void>(resolve => {
        resolveShare = resolve;
      }));
      
      render(<ShareButton analysis={mockAnalysis} />);
      
      const button = screen.getByRole('button', { name: /share/i });
      
      await act(async () => {
        fireEvent.click(button);
      });
      
      expect(button).toBeDisabled();
      
      await act(async () => {
        resolveShare!();
      });
      
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });
});
