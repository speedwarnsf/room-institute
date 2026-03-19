import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock canvas/Image for Node environment
beforeEach(() => {
  // Mock Image constructor
  (globalThis as any).Image = class MockImage {
    onload: any = null;
    onerror: any = null;
    src = '';
    width = 10;
    height = 10;
    constructor() {
      setTimeout(() => this.onload?.(), 0);
    }
  };

  // Mock canvas
  const mockCtx = {
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray([
        255, 0, 0, 255,    // red
        255, 0, 0, 255,    // red
        0, 0, 255, 255,    // blue
        0, 255, 0, 255,    // green
        255, 255, 255, 255, // white
        0, 0, 0, 255,      // black
      ]),
    })),
  };
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'canvas') {
      return { width: 0, height: 0, getContext: () => mockCtx } as any;
    }
    return document.createElement(tag);
  });
});

describe('colorExtractor', () => {
  it('should export extractColors function', async () => {
    const { extractColors } = await import('../../services/colorExtractor');
    expect(typeof extractColors).toBe('function');
  });

  it('should extract colors from a base64 image', async () => {
    const { extractColors } = await import('../../services/colorExtractor');
    const colors = await extractColors('data:image/png;base64,AAAA', 3);
    expect(Array.isArray(colors)).toBe(true);
    expect(colors.length).toBeLessThanOrEqual(3);
    if (colors.length > 0) {
      expect(colors[0]).toHaveProperty('hex');
      expect(colors[0]).toHaveProperty('rgb');
      expect(colors[0]).toHaveProperty('percentage');
      expect(colors[0]).toHaveProperty('name');
      expect(colors[0]!.hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
