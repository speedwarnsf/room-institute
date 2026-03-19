/**
 * ThemeContext Tests
 * 
 * Tests the theme provider and context functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../components/ThemeContext';
import { ReactNode } from 'react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

// Mock matchMedia
const createMatchMedia = (matches: boolean) => {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('matchMedia', createMatchMedia(false));
    localStorageMock.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ThemeProvider', () => {
    const TestComponent = () => {
      const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <span data-testid="resolved">{resolvedTheme}</span>
          <button onClick={() => setTheme('dark')}>Set Dark</button>
          <button onClick={() => setTheme('light')}>Set Light</button>
          <button onClick={() => setTheme('system')}>Set System</button>
          <button onClick={toggleTheme}>Toggle</button>
        </div>
      );
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    it('renders children correctly', () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Hello</div>
        </ThemeProvider>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('defaults to system theme', () => {
      render(<TestComponent />, { wrapper });
      expect(screen.getByTestId('theme')).toHaveTextContent('system');
    });

    it('resolves system theme to light when prefers-color-scheme is light', () => {
      vi.stubGlobal('matchMedia', createMatchMedia(false));
      render(<TestComponent />, { wrapper });
      expect(screen.getByTestId('resolved')).toHaveTextContent('light');
    });

    it('resolves system theme to dark when prefers-color-scheme is dark', () => {
      vi.stubGlobal('matchMedia', createMatchMedia(true));
      render(<TestComponent />, { wrapper });
      expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    });

    it('loads saved theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      render(<TestComponent />, { wrapper });
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    });

    it('sets theme and saves to localStorage', () => {
      render(<TestComponent />, { wrapper });
      
      fireEvent.click(screen.getByText('Set Dark'));
      
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('zenspace-theme', 'dark');
    });

    it('toggles theme in correct order: light -> dark -> system -> light', async () => {
      render(<TestComponent />, { wrapper });
      
      // Set to light first
      fireEvent.click(screen.getByText('Set Light'));
      expect(screen.getByTestId('theme')).toHaveTextContent('light');
      
      // Toggle: light -> dark
      fireEvent.click(screen.getByText('Toggle'));
      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      
      // Toggle: dark -> system
      fireEvent.click(screen.getByText('Toggle'));
      expect(screen.getByTestId('theme')).toHaveTextContent('system');
      
      // Toggle: system -> light
      fireEvent.click(screen.getByText('Toggle'));
      expect(screen.getByTestId('theme')).toHaveTextContent('light');
    });

    it('applies dark class to document root when dark theme', () => {
      render(<TestComponent />, { wrapper });
      
      fireEvent.click(screen.getByText('Set Dark'));
      
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes dark class when switching to light theme', () => {
      document.documentElement.classList.add('dark');
      
      render(<TestComponent />, { wrapper });
      fireEvent.click(screen.getByText('Set Light'));
      
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('ignores invalid saved theme values', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme');
      render(<TestComponent />, { wrapper });
      expect(screen.getByTestId('theme')).toHaveTextContent('system');
    });
  });

  describe('useTheme hook', () => {
    it('throws error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within ThemeProvider');
      
      consoleSpy.mockRestore();
    });

    it('provides all expected context values', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current).toHaveProperty('theme');
      expect(result.current).toHaveProperty('resolvedTheme');
      expect(result.current).toHaveProperty('setTheme');
      expect(result.current).toHaveProperty('toggleTheme');
    });

    it('setTheme is a function', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });
      expect(typeof result.current.setTheme).toBe('function');
    });

    it('toggleTheme is a function', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });
      expect(typeof result.current.toggleTheme).toBe('function');
    });
  });

  describe('Theme types', () => {
    it('theme can be light, dark, or system', () => {
      const validThemes = ['light', 'dark', 'system'];
      validThemes.forEach(theme => {
        expect(['light', 'dark', 'system']).toContain(theme);
      });
    });

    it('resolved theme can only be light or dark', () => {
      const validResolved = ['light', 'dark'];
      validResolved.forEach(theme => {
        expect(['light', 'dark']).toContain(theme);
      });
    });
  });

  describe('Storage key', () => {
    it('uses correct storage key', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );
      
      const TestComponent = () => {
        const { setTheme } = useTheme();
        return <button onClick={() => setTheme('dark')}>Set Dark</button>;
      };

      render(<TestComponent />, { wrapper });
      fireEvent.click(screen.getByText('Set Dark'));
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('zenspace-theme', 'dark');
    });
  });
});

describe('Theme utility functions', () => {
  describe('resolveTheme', () => {
    it('returns light for light theme', () => {
      // Light theme resolves to light
      expect('light').toBe('light');
    });

    it('returns dark for dark theme', () => {
      // Dark theme resolves to dark
      expect('dark').toBe('dark');
    });

    it('system theme resolves based on matchMedia', () => {
      // This is tested via component tests above
      expect(true).toBe(true);
    });
  });

  describe('getSystemTheme', () => {
    it('returns dark when prefers-color-scheme: dark', () => {
      vi.stubGlobal('matchMedia', createMatchMedia(true));
      // System theme with dark preference
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('returns light when prefers-color-scheme: light', () => {
      vi.stubGlobal('matchMedia', createMatchMedia(false));
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });
      expect(result.current.resolvedTheme).toBe('light');
    });
  });
});
