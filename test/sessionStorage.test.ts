/**
 * Tests for Session Storage Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateSessionId,
  generateSessionName,
  saveSession,
  getAllSessions,
  getSession,
  deleteSession,
  renameSession,
  updateSessionTags,
  exportSession,
  importSession,
  getStorageInfo,
  clearAllSessions,
  searchSessions,
  getSessionMetadata
} from '../services/sessionStorage';
import { AnalysisResult, ChatMessage, UploadedImage } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] || null)
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock Image for thumbnail generation
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _src = '';
  width = 800;
  height = 600;
  
  get src(): string {
    return this._src;
  }
  
  set src(value: string) {
    this._src = value;
    // Trigger onload asynchronously after src is set
    setTimeout(() => this.onload?.(), 0);
  }
}

(global as any).Image = MockImage;

// Mock canvas
const mockContext = {
  drawImage: vi.fn()
};

const mockCanvas = {
  getContext: vi.fn(() => mockContext),
  toDataURL: vi.fn(() => 'data:image/jpeg;base64,thumbnail'),
  width: 0,
  height: 0
};

document.createElement = vi.fn((tag: string) => {
  if (tag === 'canvas') return mockCanvas as any;
  return {} as any;
});

// Test fixtures
const mockImage: UploadedImage = {
  dataUrl: 'data:image/jpeg;base64,/9j/test',
  base64: '/9j/test',
  mimeType: 'image/jpeg',
  fileName: 'room.jpg'
};

const mockAnalysis: AnalysisResult = {
  rawText: '# Analysis\n\nThis bedroom needs organization.',
  visualizationPrompt: 'Organized bedroom',
  products: [{ name: 'Storage Bin', searchTerm: 'storage bin', reason: 'For clothes' }]
};

const mockMessages: ChatMessage[] = [
  { id: '1', role: 'user', text: 'How do I start?', timestamp: Date.now() },
  { id: '2', role: 'model', text: 'Start with decluttering.', timestamp: Date.now() }
];

describe('Session ID Generation', () => {
  it('generates unique IDs', () => {
    const id1 = generateSessionId();
    const id2 = generateSessionId();
    
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/);
  });
  
  it('includes timestamp in ID', () => {
    const before = Date.now();
    const id = generateSessionId();
    const after = Date.now();
    
    const timestamp = parseInt(id.split('_')[1] || '0');
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});

describe('Session Name Generation', () => {
  it('detects bedroom from analysis', () => {
    const name = generateSessionName(mockAnalysis);
    expect(name.toLowerCase()).toContain('bedroom');
  });
  
  it('detects various room types', () => {
    const rooms = ['kitchen', 'living room', 'office', 'bathroom', 'closet'];
    
    for (const room of rooms) {
      const analysis: AnalysisResult = {
        rawText: `This ${room} needs organizing.`,
        visualizationPrompt: '',
        products: []
      };
      
      const name = generateSessionName(analysis);
      // Check that the room type is present in the generated name
      expect(name.toLowerCase()).toContain(room.toLowerCase());
    }
  });
  
  it('falls back to generic name', () => {
    const analysis: AnalysisResult = {
      rawText: 'Some random text without room type.',
      visualizationPrompt: '',
      products: []
    };
    
    const name = generateSessionName(analysis);
    expect(name).toContain('Room Analysis');
  });
  
  it('includes date in name', () => {
    const name = generateSessionName(mockAnalysis);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    expect(monthNames.some(m => name.includes(m))).toBe(true);
  });
});

describe('Session CRUD Operations', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });
  
  it('saves a new session', async () => {
    const session = await saveSession(mockImage, mockAnalysis, mockMessages);
    
    expect(session.id).toBeDefined();
    expect(session.name).toBeDefined();
    expect(session.thumbnail).toBeDefined();
    expect(session.image).toEqual(mockImage);
    expect(session.analysis).toEqual(mockAnalysis);
    expect(session.messages).toEqual(mockMessages);
  });
  
  it('retrieves saved sessions', async () => {
    await saveSession(mockImage, mockAnalysis, mockMessages);
    
    const sessions = getAllSessions();
    expect(sessions.length).toBe(1);
  });
  
  it('retrieves a specific session', async () => {
    const saved = await saveSession(mockImage, mockAnalysis, mockMessages);
    
    const retrieved = getSession(saved.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(saved.id);
  });
  
  it('returns null for non-existent session', () => {
    const session = getSession('non-existent-id');
    expect(session).toBeNull();
  });
  
  it('updates existing session', async () => {
    const saved = await saveSession(mockImage, mockAnalysis, mockMessages);
    
    const newMessages = [...mockMessages, { id: '3', role: 'user' as const, text: 'Thanks!', timestamp: Date.now() }];
    
    await saveSession(mockImage, mockAnalysis, newMessages, undefined, saved.id);
    
    const sessions = getAllSessions();
    expect(sessions.length).toBe(1);
    expect(sessions[0]!.messages.length).toBe(3);
  });
  
  it('deletes a session', async () => {
    const saved = await saveSession(mockImage, mockAnalysis, mockMessages);
    
    const deleted = deleteSession(saved.id);
    expect(deleted).toBe(true);
    
    const sessions = getAllSessions();
    expect(sessions.length).toBe(0);
  });
  
  it('returns false when deleting non-existent session', () => {
    const deleted = deleteSession('non-existent');
    expect(deleted).toBe(false);
  });
  
  it('renames a session', async () => {
    const saved = await saveSession(mockImage, mockAnalysis, mockMessages);
    
    const renamed = renameSession(saved.id, 'My Custom Name');
    expect(renamed).toBe(true);
    
    const retrieved = getSession(saved.id);
    expect(retrieved?.name).toBe('My Custom Name');
  });
});

describe('Session Tags', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });
  
  it('saves session with tags', async () => {
    const session = await saveSession(
      mockImage, 
      mockAnalysis, 
      mockMessages, 
      undefined, 
      undefined, 
      undefined,
      ['bedroom', 'urgent']
    );
    
    expect(session.tags).toEqual(['bedroom', 'urgent']);
  });
  
  it('updates session tags', async () => {
    const saved = await saveSession(mockImage, mockAnalysis, mockMessages);
    
    updateSessionTags(saved.id, ['completed', 'favorite']);
    
    const retrieved = getSession(saved.id);
    expect(retrieved?.tags).toEqual(['completed', 'favorite']);
  });
});

describe('Session Search', () => {
  beforeEach(async () => {
    localStorageMock.clear();
    vi.clearAllMocks();
    
    // Create test sessions
    await saveSession(mockImage, mockAnalysis, mockMessages, undefined, 'id1', 'Master Bedroom', ['bedroom']);
    await saveSession(mockImage, mockAnalysis, mockMessages, undefined, 'id2', 'Kitchen Pantry', ['kitchen']);
    await saveSession(mockImage, mockAnalysis, mockMessages, undefined, 'id3', 'Kids Room', ['bedroom', 'kids']);
  });
  
  it('searches by name', () => {
    const results = searchSessions('bedroom');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some(r => r.name === 'Master Bedroom')).toBe(true);
  });
  
  it('searches by tag', () => {
    const results = searchSessions('kids');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some(r => r.name === 'Kids Room')).toBe(true);
  });
  
  it('returns empty for no matches', () => {
    const results = searchSessions('garage');
    expect(results.length).toBe(0);
  });
  
  it('is case insensitive', () => {
    const lower = searchSessions('kitchen');
    const upper = searchSessions('KITCHEN');
    
    expect(lower.length).toBe(upper.length);
  });
});

describe('Session Export/Import', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });
  
  it('exports session as JSON', async () => {
    const saved = await saveSession(mockImage, mockAnalysis, mockMessages);
    
    const json = exportSession(saved.id);
    expect(json).not.toBeNull();
    
    const parsed = JSON.parse(json!);
    expect(parsed.id).toBe(saved.id);
    expect(parsed.analysis).toEqual(mockAnalysis);
  });
  
  it('returns null for non-existent export', () => {
    const json = exportSession('non-existent');
    expect(json).toBeNull();
  });
  
  it('imports session from JSON', async () => {
    const saved = await saveSession(mockImage, mockAnalysis, mockMessages);
    const json = exportSession(saved.id);
    
    // Clear and re-import
    clearAllSessions();
    const imported = importSession(json!);
    
    expect(imported).not.toBeNull();
    expect(imported?.analysis).toEqual(mockAnalysis);
    expect(imported?.id).not.toBe(saved.id); // New ID
  });
  
  it('returns null for invalid JSON', () => {
    const result = importSession('not valid json');
    expect(result).toBeNull();
  });
  
  it('returns null for missing required fields', () => {
    const result = importSession('{"name": "test"}');
    expect(result).toBeNull();
  });
});

describe('Storage Info', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });
  
  it('returns correct session count', async () => {
    await saveSession(mockImage, mockAnalysis, mockMessages, undefined, 'id1', 'Session 1');
    await saveSession(mockImage, mockAnalysis, mockMessages, undefined, 'id2', 'Session 2');
    
    const info = getStorageInfo();
    expect(info.sessionCount).toBe(2);
    expect(info.maxSessions).toBe(20);
  });
  
  it('estimates storage size', async () => {
    await saveSession(mockImage, mockAnalysis, mockMessages);
    
    const info = getStorageInfo();
    expect(info.estimatedSize).toBeGreaterThan(0);
  });
});

describe('Session Metadata', () => {
  beforeEach(async () => {
    localStorageMock.clear();
    vi.clearAllMocks();
    
    await saveSession(mockImage, mockAnalysis, mockMessages, undefined, 'id1', 'Test Session');
  });
  
  it('returns metadata without full data', () => {
    const metadata = getSessionMetadata();
    
    expect(metadata.length).toBe(1);
    expect(metadata[0]!.id).toBe('id1');
    expect(metadata[0]!.name).toBe('Test Session');
    expect(metadata[0]!.messageCount).toBe(2);
    expect((metadata[0] as any).image).toBeUndefined();
    expect((metadata[0] as any).analysis).toBeUndefined();
  });
});

describe('Clear All Sessions', () => {
  it('removes all sessions', async () => {
    await saveSession(mockImage, mockAnalysis, mockMessages, undefined, 'id1');
    await saveSession(mockImage, mockAnalysis, mockMessages, undefined, 'id2');
    
    clearAllSessions();
    
    expect(getAllSessions().length).toBe(0);
    expect(getSessionMetadata().length).toBe(0);
  });
});

describe('Session Limit', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });
  
  it('respects max session limit', async () => {
    // Create more than max sessions
    for (let i = 0; i < 25; i++) {
      await saveSession(
        mockImage, 
        mockAnalysis, 
        mockMessages, 
        undefined, 
        `id-${i}`, 
        `Session ${i}`
      );
    }
    
    const sessions = getAllSessions();
    expect(sessions.length).toBeLessThanOrEqual(20);
  });
  
  it('removes oldest sessions first', async () => {
    // Create sessions
    for (let i = 0; i < 22; i++) {
      await saveSession(
        mockImage, 
        mockAnalysis, 
        mockMessages, 
        undefined, 
        `id-${i}`, 
        `Session ${i}`
      );
    }
    
    const sessions = getAllSessions();
    
    // Newest should still be there
    expect(sessions.some(s => s.name === 'Session 21')).toBe(true);
    
    // Oldest should be removed
    expect(sessions.some(s => s.name === 'Session 0')).toBe(false);
  });
});

describe('Edge Cases', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });
  
  it('handles empty messages array', async () => {
    const session = await saveSession(mockImage, mockAnalysis, []);
    expect(session.messages).toEqual([]);
  });
  
  it('handles undefined visualization', async () => {
    const session = await saveSession(mockImage, mockAnalysis, mockMessages);
    expect(session.visualizationImage).toBeUndefined();
  });
  
  it('handles special characters in name', async () => {
    const session = await saveSession(
      mockImage, 
      mockAnalysis, 
      mockMessages, 
      undefined, 
      undefined, 
      'My Room 🏠 & "Special" <Chars>'
    );
    
    expect(session.name).toBe('My Room 🏠 & "Special" <Chars>');
    
    const retrieved = getSession(session.id);
    expect(retrieved?.name).toBe('My Room 🏠 & "Special" <Chars>');
  });
  
  it('preserves createdAt on update', async () => {
    const saved = await saveSession(mockImage, mockAnalysis, mockMessages);
    const originalCreatedAt = saved.createdAt;
    
    // Wait a bit
    await new Promise(r => setTimeout(r, 10));
    
    // Update session
    await saveSession(mockImage, mockAnalysis, mockMessages, undefined, saved.id);
    
    const retrieved = getSession(saved.id);
    expect(retrieved?.createdAt).toBe(originalCreatedAt);
    expect(retrieved?.updatedAt).toBeGreaterThan(originalCreatedAt);
  });
});
