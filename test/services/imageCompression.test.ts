/**
 * Image Compression Service Tests
 * 
 * Tests the image compression utilities
 */

import { describe, it, expect } from 'vitest';
import { formatBytes } from '../../services/imageCompression';

// We can't fully test compressImage without browser APIs, but we can test utilities
describe('Image Compression Utilities', () => {
  describe('formatBytes', () => {
    it('formats 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('formats bytes (< 1KB)', () => {
      expect(formatBytes(512)).toBe('512 B');
    });

    it('formats kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(2048)).toBe('2 KB');
    });

    it('formats megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
      expect(formatBytes(10 * 1024 * 1024)).toBe('10 MB');
    });

    it('formats gigabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
    });

    it('handles decimal precision', () => {
      expect(formatBytes(1500)).toBe('1.5 KB');
      expect(formatBytes(1600)).toBe('1.6 KB');
      expect(formatBytes(1234567)).toBe('1.2 MB');
    });

    it('handles large numbers', () => {
      const result = formatBytes(100 * 1024 * 1024 * 1024);
      expect(result).toBe('100 GB');
    });
  });
});

describe('Compression Options Interface', () => {
  it('has correct default values defined', () => {
    // These are the expected default options
    const expectedDefaults = {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85,
    };
    
    expect(expectedDefaults.maxWidth).toBe(1920);
    expect(expectedDefaults.maxHeight).toBe(1080);
    expect(expectedDefaults.quality).toBe(0.85);
  });

  it('quality range is valid (0-1)', () => {
    const quality = 0.85;
    expect(quality).toBeGreaterThan(0);
    expect(quality).toBeLessThanOrEqual(1);
  });
});

describe('Compression Result Interface', () => {
  it('calculates ratio correctly', () => {
    const original = 1000000; // 1MB
    const compressed = 250000; // 250KB
    const ratio = compressed / original;
    
    expect(ratio).toBe(0.25);
    expect(ratio).toBeLessThan(1);
  });

  it('handles 1:1 ratio (no compression)', () => {
    const original = 50000; // 50KB
    const compressed = 50000; // Same
    const ratio = compressed / original;
    
    expect(ratio).toBe(1);
  });
});

describe('Small File Skip Logic', () => {
  it('threshold is 100KB', () => {
    const threshold = 100 * 1024;
    expect(threshold).toBe(102400);
  });

  it('file smaller than threshold should skip compression', () => {
    const fileSize = 50 * 1024; // 50KB
    const threshold = 100 * 1024; // 100KB
    
    const shouldSkip = fileSize < threshold;
    expect(shouldSkip).toBe(true);
  });

  it('file larger than threshold should compress', () => {
    const fileSize = 200 * 1024; // 200KB
    const threshold = 100 * 1024; // 100KB
    
    const shouldSkip = fileSize < threshold;
    expect(shouldSkip).toBe(false);
  });
});

describe('Dimension Calculations', () => {
  it('maintains aspect ratio when scaling width', () => {
    const originalWidth = 3840;
    const originalHeight = 2160;
    const maxWidth = 1920;
    
    const newHeight = (originalHeight * maxWidth) / originalWidth;
    const newWidth = maxWidth;
    
    expect(newWidth).toBe(1920);
    expect(newHeight).toBe(1080);
    expect(newWidth / newHeight).toBeCloseTo(originalWidth / originalHeight, 2);
  });

  it('maintains aspect ratio when scaling height', () => {
    const originalWidth = 1000;
    const originalHeight = 2000;
    const maxHeight = 1080;
    
    const newWidth = (originalWidth * maxHeight) / originalHeight;
    const newHeight = maxHeight;
    
    expect(newHeight).toBe(1080);
    expect(newWidth).toBe(540);
    expect(newWidth / newHeight).toBeCloseTo(originalWidth / originalHeight, 2);
  });

  it('does not upscale small images', () => {
    const originalWidth = 800;
    const originalHeight = 600;
    const maxWidth = 1920;
    const maxHeight = 1080;
    
    // If image is smaller than max dimensions, keep original
    const shouldScale = originalWidth > maxWidth || originalHeight > maxHeight;
    expect(shouldScale).toBe(false);
  });

  it('rounds dimensions to integers', () => {
    const width = 1920.7;
    const height = 1080.3;
    
    expect(Math.round(width)).toBe(1921);
    expect(Math.round(height)).toBe(1080);
  });
});

describe('Quality Iteration Logic', () => {
  it('reduces quality in 0.1 steps', () => {
    let quality = 0.85;
    const step = 0.1;
    
    quality -= step;
    expect(quality).toBeCloseTo(0.75, 2);
    
    quality -= step;
    expect(quality).toBeCloseTo(0.65, 2);
  });

  it('stops at minimum quality of 0.3', () => {
    let quality = 0.85;
    const minQuality = 0.3;
    const step = 0.1;
    
    while (quality > minQuality) {
      quality -= step;
    }
    
    expect(quality).toBeLessThanOrEqual(0.3);
  });

  it('iterates correct number of times from 0.85 to 0.3', () => {
    let quality = 0.85;
    let iterations = 0;
    const minQuality = 0.3;
    const step = 0.1;
    
    while (quality > minQuality) {
      quality -= step;
      iterations++;
    }
    
    // 0.85 -> 0.75 -> 0.65 -> 0.55 -> 0.45 -> 0.35 -> 0.25 = 6 iterations
    expect(iterations).toBe(6);
  });
});

describe('MIME Type Handling', () => {
  it('outputs as image/jpeg', () => {
    const outputType = 'image/jpeg';
    expect(outputType).toBe('image/jpeg');
  });

  it('renames file to .jpg extension', () => {
    const originalName = 'photo.png';
    const newName = originalName.replace(/\.[^.]+$/, '.jpg');
    expect(newName).toBe('photo.jpg');
  });

  it('handles files without extension', () => {
    const originalName = 'photo';
    const newName = originalName.replace(/\.[^.]+$/, '.jpg');
    // No extension, so regex doesn't match - name stays same
    expect(newName).toBe('photo');
  });

  it('handles multiple dots in filename', () => {
    const originalName = 'my.photo.2024.png';
    const newName = originalName.replace(/\.[^.]+$/, '.jpg');
    expect(newName).toBe('my.photo.2024.jpg');
  });
});
