/**
 * Tests for DesignExportMenu component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DesignExportMenu } from '../../components/DesignExportMenu';
import type { LookbookEntry, DesignOption } from '../../types';

// Mock AuthProvider
vi.mock('../../components/AuthProvider', () => ({
  useAuth: () => ({
    userTier: { tier: 'free', generationsUsed: 0, generationsLimit: 3, iterationsUsed: 0, iterationsLimit: 0, roomsUsed: 0, roomsLimit: 1 },
    user: null,
    subscription: null,
    isLoading: false,
    signInGoogle: vi.fn(),
    signInApple: vi.fn(),
    signInMagic: vi.fn(),
    signInPassword: vi.fn(),
    signOut: vi.fn(),
    refreshTier: vi.fn(),
  }),
}));

// Mock export service
vi.mock('../../services/designExport', () => ({
  downloadDesignImage: vi.fn(),
  downloadBeforeAfter: vi.fn(),
  downloadDesignReport: vi.fn(),
  downloadSocialTemplate: vi.fn(),
}));

const mockOption: DesignOption = {
  name: 'Test Design',
  mood: 'A test mood.',
  frameworks: ['Biophilic'],
  palette: ['#111', '#222', '#333', '#444', '#555'],
  keyChanges: ['Change 1'],
  fullPlan: 'Full plan text',
  visualizationPrompt: 'prompt',
  visualizationImage: 'base64data',
};

const mockEntry: LookbookEntry = {
  id: 'e1',
  option: mockOption,
  rating: null,
  generatedAt: Date.now(),
  batchIndex: 0,
};

describe('DesignExportMenu', () => {
  it('renders the dropdown trigger button', () => {
    render(<DesignExportMenu entry={mockEntry} />);
    expect(screen.getByLabelText('Export and download options')).toBeDefined();
  });

  it('opens dropdown on click and shows menu items', async () => {
    const user = userEvent.setup();
    render(<DesignExportMenu entry={mockEntry} />);
    await user.click(screen.getByLabelText('Export and download options'));
    expect(screen.getByText('Download Design')).toBeDefined();
    expect(screen.getByText('Design Report (PDF)')).toBeDefined();
    expect(screen.getByText('Instagram Template')).toBeDefined();
    expect(screen.getByText('Pinterest Template')).toBeDefined();
  });

  it('renders compact mode with separate buttons', () => {
    render(<DesignExportMenu entry={mockEntry} compact />);
    expect(screen.getByLabelText('Download design image')).toBeDefined();
    expect(screen.getByLabelText('Download PDF report')).toBeDefined();
    expect(screen.getByLabelText('More export options')).toBeDefined();
  });

  it('shows free tier preview labels', async () => {
    const user = userEvent.setup();
    render(<DesignExportMenu entry={mockEntry} />);
    await user.click(screen.getByLabelText('Export and download options'));
    // Free tier info banner
    expect(screen.getByText(/Free tier/)).toBeDefined();
  });

  it('disables before/after when no source image', async () => {
    const user = userEvent.setup();
    render(<DesignExportMenu entry={mockEntry} />);
    await user.click(screen.getByLabelText('Export and download options'));
    const beforeAfterBtn = screen.getByText('Before / After').closest('button');
    expect(beforeAfterBtn).toBeDefined();
    expect(beforeAfterBtn!.hasAttribute('disabled')).toBe(true);
  });
});
