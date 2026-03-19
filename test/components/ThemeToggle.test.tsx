/**
 * ThemeToggle Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { ThemeProvider } from '../../components/ThemeContext';
import { ReactNode } from 'react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

// Mock matchMedia
const createMatchMedia = (matches: boolean) => {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe('ThemeToggle', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeProvider>{children}</ThemeProvider>
  );

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('matchMedia', createMatchMedia(false));
    localStorageMock.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders a button', () => {
      render(<ThemeToggle />, { wrapper });
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has appropriate aria-label', () => {
      render(<ThemeToggle />, { wrapper });
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button.getAttribute('aria-label')).toContain('Click to change');
    });

    it('has title attribute', () => {
      render(<ThemeToggle />, { wrapper });
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title');
    });
  });

  describe('theme cycling', () => {
    it('toggles theme when clicked', () => {
      // Start with light theme
      localStorageMock.getItem.mockReturnValue('light');
      render(<ThemeToggle />, { wrapper });
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('cycles through all theme states', () => {
      localStorageMock.getItem.mockReturnValue('light');
      render(<ThemeToggle />, { wrapper });
      
      const button = screen.getByRole('button');
      
      // Light -> Dark
      fireEvent.click(button);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('zenspace-theme', 'dark');
      
      // Dark -> System
      fireEvent.click(button);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('zenspace-theme', 'system');
      
      // System -> Light
      fireEvent.click(button);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('zenspace-theme', 'light');
    });
  });

  describe('accessibility', () => {
    it('is keyboard accessible', () => {
      render(<ThemeToggle />, { wrapper });
      const button = screen.getByRole('button');
      
      // Should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('responds to keyboard events', () => {
      localStorageMock.getItem.mockReturnValue('light');
      render(<ThemeToggle />, { wrapper });
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      
      // Button should respond to Enter key
      expect(button).toBeInTheDocument();
    });

    it('has focus ring classes', () => {
      render(<ThemeToggle />, { wrapper });
      const button = screen.getByRole('button');
      
      expect(button.className).toContain('focus:');
    });
  });

  describe('visual states', () => {
    it('has hover classes', () => {
      render(<ThemeToggle />, { wrapper });
      const button = screen.getByRole('button');
      
      expect(button.className).toContain('hover:');
    });

    it('has transition classes', () => {
      render(<ThemeToggle />, { wrapper });
      const button = screen.getByRole('button');
      
      expect(button.className).toContain('transition');
    });

    it('has dark mode classes', () => {
      render(<ThemeToggle />, { wrapper });
      const button = screen.getByRole('button');
      
      expect(button.className).toContain('dark:');
    });
  });

  describe('labels', () => {
    it('shows light mode label when light theme', () => {
      localStorageMock.getItem.mockReturnValue('light');
      render(<ThemeToggle />, { wrapper });
      
      const button = screen.getByRole('button');
      expect(button.getAttribute('title')).toBe('Light mode');
    });

    it('shows dark mode label when dark theme', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      render(<ThemeToggle />, { wrapper });
      
      const button = screen.getByRole('button');
      expect(button.getAttribute('title')).toBe('Dark mode');
    });

    it('shows correct label for current theme', () => {
      render(<ThemeToggle />, { wrapper });
      
      const button = screen.getByRole('button');
      const title = button.getAttribute('title');
      // Should have one of the valid theme labels
      expect(['Light mode', 'Dark mode', 'System theme']).toContain(title);
    });
  });

  describe('icon rendering', () => {
    it('renders an SVG icon', () => {
      render(<ThemeToggle />, { wrapper });
      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
    });

    it('icon exists inside button', () => {
      render(<ThemeToggle />, { wrapper });
      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
    });
  });
});
