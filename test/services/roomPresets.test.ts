import { describe, it, expect } from 'vitest';
import { ROOM_PRESETS } from '../../services/roomPresets';

describe('roomPresets', () => {
  it('should have at least 5 presets', () => {
    expect(ROOM_PRESETS.length).toBeGreaterThanOrEqual(5);
  });

  it('each preset should have required fields', () => {
    for (const preset of ROOM_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.style).toBeTruthy();
      expect(preset.roomType).toBeTruthy();
      expect(preset.palette.length).toBeGreaterThanOrEqual(3);
      expect(preset.keywords.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('each preset should have unique id', () => {
    const ids = ROOM_PRESETS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('palette colors should be valid hex', () => {
    for (const preset of ROOM_PRESETS) {
      for (const color of preset.palette) {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });
});
