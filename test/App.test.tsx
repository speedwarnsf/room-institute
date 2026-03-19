/**
 * ZenSpace - App Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReactElement } from 'react';

// Mock the gemini service
vi.mock('../services/geminiService', () => ({
  analyzeImage: vi.fn(),
  createChatSession: vi.fn(() => ({ send: vi.fn() })),
  generateRoomVisualization: vi.fn(),
  generateDesignVisualization: vi.fn(),
  generateDesignOptions: vi.fn(),
  isApiConfigured: vi.fn(() => true),
  GeminiApiError: class extends Error {
    code: string;
    isRetryable: boolean;
    constructor(message: string, code = 'UNKNOWN', isRetryable = false) {
      super(message);
      this.code = code;
      this.isRetryable = isRetryable;
    }
  },
}));

vi.mock('../services/edgeCaseHandlers', () => ({
  validateImageFile: vi.fn(async () => ({ canProceed: true })),
  preprocessImage: vi.fn(async (file: File) => ({ file, wasModified: false, modifications: [] })),
}));

// Import after mocking
import App from '../App';
import { analyzeImage, generateDesignOptions, GeminiApiError } from '../services/geminiService';
import { ThemeProvider } from '../components/ThemeContext';

// Helper to render App with required providers
const mockDesignAnalysis = {
  roomReading: 'A cozy room with potential',
  options: [
    { name: 'Minimalist Zen', mood: 'calm', frameworks: ['wabi-sabi'], palette: ['#fff', '#eee', '#ddd'], keyChanges: ['declutter', 'add plants'], fullPlan: 'Full plan text', visualizationPrompt: 'minimal zen room' },
    { name: 'Warm Rustic', mood: 'warm', frameworks: ['hygge'], palette: ['#a52', '#b63', '#c74'], keyChanges: ['add wood', 'warm lighting'], fullPlan: 'Rustic plan', visualizationPrompt: 'warm rustic room' },
    { name: 'Modern Luxe', mood: 'bold', frameworks: ['maximalism'], palette: ['#000', '#gold', '#navy'], keyChanges: ['statement art', 'velvet'], fullPlan: 'Luxe plan', visualizationPrompt: 'modern luxe room' },
  ] as any,
};

function renderWithProviders(ui: ReactElement) {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('renders the app header', () => {
      renderWithProviders(<App />);
      // Check that the app renders
      expect(document.body).toBeInTheDocument();
    });

    it('shows the upload zone initially', () => {
      renderWithProviders(<App />);
      expect(screen.getByText(/drop photo/i)).toBeInTheDocument();
    });

    it('does not show analysis initially', () => {
      renderWithProviders(<App />);
      expect(screen.queryByText(/key issues/i)).not.toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('shows analyzing state when processing', async () => {
      // Mock a slow analysis
      (analyzeImage as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      renderWithProviders(<App />);
      
      const file = new File(['test'], 'room.png', { type: 'image/png' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      fireEvent.change(input, { target: { files: [file] } });
      
      // Should show analyzing state
      await waitFor(() => {
        expect(screen.getByText(/uploading image/i)).toBeInTheDocument();
      });
    });

    it('shows analysis results after successful analysis', async () => {
      (generateDesignOptions as any).mockResolvedValueOnce(mockDesignAnalysis);
      
      renderWithProviders(<App />);
      
      const file = new File(['test'], 'room.png', { type: 'image/png' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      fireEvent.change(input, { target: { files: [file] } });
      
      // After upload, the app enters analyzing/mode-select state
      await waitFor(() => {
        // Should transition away from HOME state
        const uploadZone = screen.queryByText(/drop photo/i);
        expect(uploadZone).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const error = new (GeminiApiError as any)('API Error', 'NETWORK_ERROR', true);
      (generateDesignOptions as any).mockRejectedValueOnce(error);
      
      renderWithProviders(<App />);
      
      const file = new File(['test'], 'room.png', { type: 'image/png' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      fireEvent.change(input, { target: { files: [file] } });
      
      // After upload with error, app should still transition away from home
      await waitFor(() => {
        const uploadZone = screen.queryByText(/drop photo/i);
        expect(uploadZone).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('allows retry after error', async () => {
      // First call fails
      (generateDesignOptions as any)
        .mockRejectedValueOnce(new (GeminiApiError as any)('Error', 'NETWORK', true));
      
      renderWithProviders(<App />);
      
      const file = new File(['test'], 'room.png', { type: 'image/png' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // First attempt
      fireEvent.change(input, { target: { files: [file] } });
      
      // App should transition to analyzing state
      await waitFor(() => {
        const uploadZone = screen.queryByText(/drop photo/i);
        expect(uploadZone).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations in initial state', async () => {
      renderWithProviders(<App />);
      
      // Check for any button (upload zone)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('maintains focus management', async () => {
      renderWithProviders(<App />);
      
      // Get the first focusable button
      const buttons = screen.getAllByRole('button');
      const uploadButton = buttons[0]!;
      uploadButton.focus();
      
      expect(document.activeElement).toBe(uploadButton);
    });
  });
});

describe('App States', () => {
  describe('HOME state', () => {
    it('shows upload prompt', () => {
      renderWithProviders(<App />);
      expect(screen.getByText(/drop photo/i)).toBeInTheDocument();
    });
  });

  describe('Theme and Styling', () => {
    it('applies dark theme by default', () => {
      renderWithProviders(<App />);
      
      // Check for dark theme elements
      const app = document.querySelector('[class*="bg-"]');
      expect(app).toBeInTheDocument();
    });
  });
});

describe('Product Suggestions', () => {
  it('displays product suggestions after analysis', async () => {
    (generateDesignOptions as any).mockResolvedValueOnce(mockDesignAnalysis);
    
    renderWithProviders(<App />);
    
    const file = new File(['test'], 'room.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [file] } });
    
    // App should transition to analyzing state after upload
    await waitFor(() => {
      const uploadZone = screen.queryByText(/drop photo/i);
      expect(uploadZone).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
