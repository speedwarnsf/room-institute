import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MoodBoard } from '../../components/MoodBoard';

// Mock IndexedDB
const mockIDB = {
  open: vi.fn(() => ({
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
    result: {
      objectStoreNames: { contains: () => true },
      transaction: () => ({
        objectStore: () => ({
          getAll: () => ({ onsuccess: null, onerror: null, result: [] }),
          put: vi.fn(),
          delete: vi.fn(),
        }),
        oncomplete: null,
        onerror: null,
      }),
    },
  })),
};

beforeEach(() => {
  (globalThis as any).indexedDB = mockIDB;
});

describe('MoodBoard', () => {
  it('renders compact button when compact=true', () => {
    render(<MoodBoard compact />);
    expect(screen.getByText(/Mood Board/)).toBeDefined();
  });

  it('renders full board when compact=false', () => {
    render(<MoodBoard />);
    expect(screen.getByText('Mood Board')).toBeDefined();
    expect(screen.getByText('New Board')).toBeDefined();
  });
});
