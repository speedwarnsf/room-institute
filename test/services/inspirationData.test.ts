import { describe, it, expect } from 'vitest';
import {
  INSPIRATION_IMAGES,
  DESIGN_TIPS,
  DESIGN_STYLES,
  getTrendingStyles,
  getImagesByStyle,
  getImageById,
} from '../../services/inspirationData';

describe('inspirationData', () => {
  it('has images for every defined style', () => {
    for (const style of DESIGN_STYLES) {
      const images = getImagesByStyle(style);
      expect(images.length).toBeGreaterThan(0);
    }
  });

  it('all images have required fields', () => {
    for (const img of INSPIRATION_IMAGES) {
      expect(img.id).toBeTruthy();
      expect(img.src).toBeTruthy();
      expect(img.alt).toBeTruthy();
      expect(img.style).toBeTruthy();
      expect(img.room).toBeTruthy();
      expect(img.tags.length).toBeGreaterThan(0);
    }
  });

  it('image IDs are unique', () => {
    const ids = INSPIRATION_IMAGES.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getImageById returns correct image', () => {
    const img = getImageById('mod-1');
    expect(img).toBeDefined();
    expect(img!.style).toBe('Modern');
  });

  it('getImageById returns undefined for missing id', () => {
    expect(getImageById('nonexistent')).toBeUndefined();
  });

  it('getTrendingStyles returns 4 trends', () => {
    const trends = getTrendingStyles();
    expect(trends).toHaveLength(4);
    for (const t of trends) {
      expect(t.style).toBeTruthy();
      expect(t.description).toBeTruthy();
      // The referenced image must exist
      expect(getImageById(t.imageId)).toBeDefined();
    }
  });

  it('design tips cover all categories', () => {
    const categories = new Set(DESIGN_TIPS.map(t => t.category));
    expect(categories.has('Color Theory')).toBe(true);
    expect(categories.has('Spatial Balance')).toBe(true);
    expect(categories.has('Lighting')).toBe(true);
  });

  it('design tips have non-empty bodies', () => {
    for (const tip of DESIGN_TIPS) {
      expect(tip.title.length).toBeGreaterThan(0);
      expect(tip.body.length).toBeGreaterThan(20);
    }
  });
});
