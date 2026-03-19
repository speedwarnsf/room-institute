import { describe, it, expect } from 'vitest';
import { canSaveToMoodBoard, getGateMessage, type UserTier } from '../../services/gating';

describe('canSaveToMoodBoard', () => {
  it('returns false for free tier', () => {
    const free: UserTier = { tier: 'free', generationsUsed: 0, generationsLimit: 3, iterationsUsed: 0, iterationsLimit: 0, roomsUsed: 0, roomsLimit: 1 };
    expect(canSaveToMoodBoard(free)).toBe(false);
  });

  it('returns true for pro tier', () => {
    const pro: UserTier = { tier: 'pro', generationsUsed: 0, generationsLimit: 50, iterationsUsed: 0, iterationsLimit: 100, roomsUsed: 0, roomsLimit: 10 };
    expect(canSaveToMoodBoard(pro)).toBe(true);
  });

  it('getGateMessage returns mood board message', () => {
    const msg = getGateMessage('mood_board');
    expect(msg).toContain('mood board');
  });
});
