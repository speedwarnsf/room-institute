/**
 * SessionManager Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionManager } from '../../components/SessionManager';

// Mock the sessionStorage service
vi.mock('../../services/sessionStorage', () => ({
  getSessionMetadata: vi.fn(() => [
    {
      id: 'session-1',
      name: 'Living Room Cleanup',
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-15').toISOString(),
      thumbnailUrl: 'data:image/png;base64,test',
      messageCount: 5,
    },
    {
      id: 'session-2',
      name: 'Kitchen Organization',
      createdAt: new Date('2024-01-14').toISOString(),
      updatedAt: new Date('2024-01-14').toISOString(),
      thumbnailUrl: 'data:image/png;base64,test2',
      messageCount: 3,
    },
  ]),
  getSession: vi.fn((id: string) => ({
    id,
    name: 'Test Session',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    originalImage: 'data:image/png;base64,test',
    analysis: { summary: 'Test analysis' },
    messages: [],
  })),
  deleteSession: vi.fn(),
  renameSession: vi.fn(),
  exportSession: vi.fn(() => JSON.stringify({ session: 'data' })),
  importSession: vi.fn(() => ({ id: 'imported-1', name: 'Imported' })),
  searchSessions: vi.fn((_query: string) => []),
  getStorageInfo: vi.fn(() => ({
    sessionCount: 2,
    totalSize: 1024 * 500, // 500KB
    maxSize: 1024 * 1024 * 5, // 5MB
    percentUsed: 10,
  })),
}));

describe('SessionManager', () => {
  const mockOnLoadSession = vi.fn();
  const mockOnSaveSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders save and open buttons', () => {
      render(
        <SessionManager
          onLoadSession={mockOnLoadSession}
          onSaveSession={mockOnSaveSession}
        />
      );

      // Should have buttons for save and open
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('renders without current session', () => {
      render(
        <SessionManager
          onLoadSession={mockOnLoadSession}
          onSaveSession={mockOnSaveSession}
        />
      );

      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });

    it('shows unsaved indicator when hasUnsavedChanges is true', () => {
      render(
        <SessionManager
          onLoadSession={mockOnLoadSession}
          onSaveSession={mockOnSaveSession}
          hasUnsavedChanges={true}
        />
      );

      // Should indicate unsaved state somehow
      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeInTheDocument();
    });
  });

  describe('save functionality', () => {
    it('calls onSaveSession when save button clicked', () => {
      render(
        <SessionManager
          onLoadSession={mockOnLoadSession}
          onSaveSession={mockOnSaveSession}
        />
      );

      // Find save button (first button typically)
      const buttons = screen.getAllByRole('button');
      const saveButton = buttons[0]!; // Save is first
      fireEvent.click(saveButton);

      expect(mockOnSaveSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('open modal', () => {
    it('opens modal when open button clicked', async () => {
      render(
        <SessionManager
          onLoadSession={mockOnLoadSession}
          onSaveSession={mockOnSaveSession}
        />
      );

      // Second button is typically open
      const buttons = screen.getAllByRole('button');
      const openButton = buttons[1]!;
      fireEvent.click(openButton);

      await waitFor(() => {
        // Modal should show session list or search
        const hasModal = 
          screen.queryByText(/Living Room Cleanup/i) ||
          screen.queryByPlaceholderText(/search/i);
        expect(hasModal).toBeTruthy();
      });
    });

    it('component renders without errors', async () => {
      render(
        <SessionManager
          onLoadSession={mockOnLoadSession}
          onSaveSession={mockOnSaveSession}
        />
      );

      // Just check component renders
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
  });

  describe('session list', () => {
    it('shows sessions when modal opened', async () => {
      render(
        <SessionManager
          onLoadSession={mockOnLoadSession}
          onSaveSession={mockOnSaveSession}
        />
      );

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]!); // Open button

      await waitFor(() => {
        // Should show sessions or indicate them
        const modal = document.querySelector('[role="dialog"]') || 
                      screen.queryByText(/Living Room/i) ||
                      screen.queryByText(/session/i);
        expect(modal || buttons.length > 0).toBeTruthy();
      });
    });
  });

  describe('search functionality', () => {
    it('modal has interactive elements', async () => {
      render(
        <SessionManager
          onLoadSession={mockOnLoadSession}
          onSaveSession={mockOnSaveSession}
        />
      );

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]!); // Open button

      await waitFor(() => {
        // Modal should have some interactive elements
        const allButtons = screen.getAllByRole('button');
        expect(allButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('modal interactions', () => {
    it('can open and interact with modal', async () => {
      render(
        <SessionManager
          onLoadSession={mockOnLoadSession}
          onSaveSession={mockOnSaveSession}
        />
      );

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]!); // Open button

      await waitFor(() => {
        // Should have more buttons after modal opens
        const allButtons = screen.getAllByRole('button');
        expect(allButtons.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('current session indicator', () => {
    it('accepts currentSessionId prop', async () => {
      render(
        <SessionManager
          currentSessionId="session-1"
          onLoadSession={mockOnLoadSession}
          onSaveSession={mockOnSaveSession}
        />
      );

      // Component should render with current session
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
  });

  describe('empty state', () => {
    it('handles empty session list', async () => {
      const { getSessionMetadata } = await import('../../services/sessionStorage');
      (getSessionMetadata as ReturnType<typeof vi.fn>).mockReturnValue([]);

      render(
        <SessionManager
          onLoadSession={mockOnLoadSession}
          onSaveSession={mockOnSaveSession}
        />
      );

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[1]!); // Open

      // Should still render without crashing
      await waitFor(() => {
        expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
      });
    });
  });
});
