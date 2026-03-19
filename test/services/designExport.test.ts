/**
 * Tests for designExport service
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock jspdf
vi.mock('jspdf', () => {
  class MockJsPDF {
    internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    setFont = vi.fn();
    setFillColor = vi.fn();
    splitTextToSize = vi.fn((t: string) => [t]);
    text = vi.fn();
    rect = vi.fn();
    addImage = vi.fn();
    addPage = vi.fn();
    setPage = vi.fn();
    getNumberOfPages = vi.fn(() => 1);
    save = vi.fn();
    setGState = vi.fn();
    GState = class { constructor(_o: any) {} };
  }
  return { default: MockJsPDF };
});

import type { DesignOption, LookbookEntry } from '../../types';

const mockOption: DesignOption = {
  name: 'Biophilic Warmth',
  mood: 'A calm, nature-inspired retreat with warm tones.',
  frameworks: ['Biophilic', 'Human-Centric'],
  palette: ['#2d4a3e', '#8b6f47', '#d4a574', '#f0e6d3', '#1a1a2e'],
  keyChanges: ['Add indoor plants', 'Warm lighting scheme', 'Natural materials'],
  fullPlan: '## Overview\nA design focused on biophilic principles.',
  visualizationPrompt: 'test prompt',
  visualizationImage: undefined,
};

const mockEntry: LookbookEntry = {
  id: 'test-1',
  option: mockOption,
  rating: null,
  generatedAt: Date.now(),
  batchIndex: 0,
};

describe('designExport', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('downloadDesignImage', () => {
    it('throws when no visualization image', async () => {
      const { downloadDesignImage } = await import('../../services/designExport');
      await expect(downloadDesignImage(mockOption, true)).rejects.toThrow('No visualization image');
    });
  });

  describe('downloadBeforeAfter', () => {
    it('throws when no visualization image', async () => {
      const { downloadBeforeAfter } = await import('../../services/designExport');
      await expect(
        downloadBeforeAfter('abc', 'image/jpeg', mockOption, true),
      ).rejects.toThrow('No visualization image');
    });
  });

  describe('downloadDesignReport', () => {
    it('generates a PDF without errors', async () => {
      const { downloadDesignReport } = await import('../../services/designExport');
      // Should not throw even without visualization image
      await expect(downloadDesignReport(mockEntry, undefined, undefined, true)).resolves.toBeUndefined();
    });

    it('generates PDF for free user without errors', async () => {
      const { downloadDesignReport } = await import('../../services/designExport');
      await expect(downloadDesignReport(mockEntry, undefined, undefined, false)).resolves.toBeUndefined();
    });
  });

  describe('downloadSocialTemplate', () => {
    it('throws when no visualization image for instagram', async () => {
      const { downloadSocialTemplate } = await import('../../services/designExport');
      await expect(
        downloadSocialTemplate({ option: mockOption, isPro: true, format: 'instagram' }),
      ).rejects.toThrow('No visualization image');
    });

    it('throws when no visualization image for pinterest', async () => {
      const { downloadSocialTemplate } = await import('../../services/designExport');
      await expect(
        downloadSocialTemplate({ option: mockOption, isPro: false, format: 'pinterest' }),
      ).rejects.toThrow('No visualization image');
    });
  });
});
