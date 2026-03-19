/**
 * Session Storage Service for ZenSpace
 * 
 * Enables saving and loading analysis sessions to localStorage/IndexedDB
 * for later reference and continuation.
 */

import { AnalysisResult, ChatMessage, UploadedImage } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface SavedSession {
  /** Unique session ID */
  id: string;
  /** Session name (user-provided or auto-generated) */
  name: string;
  /** When the session was created */
  createdAt: number;
  /** When the session was last modified */
  updatedAt: number;
  /** Thumbnail of the room image (small base64) */
  thumbnail: string;
  /** Full uploaded image data */
  image: UploadedImage;
  /** Analysis result */
  analysis: AnalysisResult;
  /** Chat history */
  messages: ChatMessage[];
  /** AI visualization image (if generated) */
  visualizationImage?: string;
  /** Tags for organizing sessions */
  tags?: string[];
}

export interface SessionMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  thumbnail: string;
  messageCount: number;
  tags?: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'zenspace_sessions';
const METADATA_KEY = 'zenspace_session_metadata';
const MAX_SESSIONS = 20;
const THUMBNAIL_SIZE = 150;
const THUMBNAIL_QUALITY = 0.7;

// ============================================================================
// THUMBNAIL GENERATION
// ============================================================================

/**
 * Generate a small thumbnail from a data URL
 */
export async function generateThumbnail(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        // Create canvas for thumbnail
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Calculate dimensions maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        let width = THUMBNAIL_SIZE;
        let height = THUMBNAIL_SIZE;
        
        if (aspectRatio > 1) {
          height = THUMBNAIL_SIZE / aspectRatio;
        } else {
          width = THUMBNAIL_SIZE * aspectRatio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw scaled image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Export as JPEG for smaller size
        const thumbnail = canvas.toDataURL('image/jpeg', THUMBNAIL_QUALITY);
        resolve(thumbnail);
      } catch (err) {
        reject(err);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
    img.src = dataUrl;
  });
}

// ============================================================================
// SESSION STORAGE
// ============================================================================

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate an auto-name for a session
 */
export function generateSessionName(analysis: AnalysisResult): string {
  // Try to extract room type from analysis
  const text = analysis.rawText.toLowerCase();
  
  const roomTypes = ['bedroom', 'living room', 'kitchen', 'bathroom', 'office', 'closet', 'garage', 'basement', 'attic', 'dining room'];
  
  for (const room of roomTypes) {
    if (text.includes(room)) {
      const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${room.charAt(0).toUpperCase() + room.slice(1)} - ${date}`;
    }
  }
  
  // Fallback to generic name
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return `Room Analysis - ${date}`;
}

/**
 * Save a session to storage
 */
export async function saveSession(
  image: UploadedImage,
  analysis: AnalysisResult,
  messages: ChatMessage[],
  visualizationImage?: string,
  sessionId?: string,
  sessionName?: string,
  tags?: string[]
): Promise<SavedSession> {
  // Generate thumbnail
  const thumbnail = await generateThumbnail(image.dataUrl);
  
  // Create session object
  const session: SavedSession = {
    id: sessionId || generateSessionId(),
    name: sessionName || generateSessionName(analysis),
    createdAt: sessionId ? getSession(sessionId)?.createdAt || Date.now() : Date.now(),
    updatedAt: Date.now(),
    thumbnail,
    image,
    analysis,
    messages,
    visualizationImage,
    tags
  };
  
  // Get existing sessions
  const sessions = getAllSessions();
  
  // Update or add session
  const existingIndex = sessions.findIndex(s => s.id === session.id);
  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    // Add new session, remove oldest if at limit
    sessions.unshift(session);
    while (sessions.length > MAX_SESSIONS) {
      sessions.pop();
    }
  }
  
  // Save to storage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    updateMetadataCache(sessions);
  } catch (err) {
    // Handle quota exceeded by removing old sessions
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, removing old sessions');
      while (sessions.length > 5) {
        sessions.pop();
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      updateMetadataCache(sessions);
    } else {
      throw err;
    }
  }
  
  return session;
}

/**
 * Get all saved sessions
 */
export function getAllSessions(): SavedSession[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Get session metadata only (for listing without loading full data)
 */
export function getSessionMetadata(): SessionMetadata[] {
  try {
    const cached = localStorage.getItem(METADATA_KEY);
    if (cached) return JSON.parse(cached);
    
    // Build from full sessions if no cache
    const sessions = getAllSessions();
    return sessions.map(s => ({
      id: s.id,
      name: s.name,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      thumbnail: s.thumbnail,
      messageCount: s.messages.length,
      tags: s.tags
    }));
  } catch {
    return [];
  }
}

/**
 * Update metadata cache
 */
function updateMetadataCache(sessions: SavedSession[]): void {
  const metadata: SessionMetadata[] = sessions.map(s => ({
    id: s.id,
    name: s.name,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    thumbnail: s.thumbnail,
    messageCount: s.messages.length,
    tags: s.tags
  }));
  
  localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
}

/**
 * Get a specific session by ID
 */
export function getSession(id: string): SavedSession | null {
  const sessions = getAllSessions();
  return sessions.find(s => s.id === id) || null;
}

/**
 * Delete a session
 */
export function deleteSession(id: string): boolean {
  const sessions = getAllSessions();
  const index = sessions.findIndex(s => s.id === id);
  
  if (index >= 0) {
    sessions.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    updateMetadataCache(sessions);
    return true;
  }
  
  return false;
}

/**
 * Rename a session
 */
export function renameSession(id: string, newName: string): boolean {
  const sessions = getAllSessions();
  const session = sessions.find(s => s.id === id);
  
  if (session) {
    session.name = newName;
    session.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    updateMetadataCache(sessions);
    return true;
  }
  
  return false;
}

/**
 * Update session tags
 */
export function updateSessionTags(id: string, tags: string[]): boolean {
  const sessions = getAllSessions();
  const session = sessions.find(s => s.id === id);
  
  if (session) {
    session.tags = tags;
    session.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    updateMetadataCache(sessions);
    return true;
  }
  
  return false;
}

/**
 * Export a session as JSON
 */
export function exportSession(id: string): string | null {
  const session = getSession(id);
  if (!session) return null;
  
  return JSON.stringify(session, null, 2);
}

/**
 * Import a session from JSON
 */
export function importSession(json: string): SavedSession | null {
  try {
    const session = JSON.parse(json) as SavedSession;
    
    // Validate required fields
    if (!session.id || !session.image || !session.analysis) {
      throw new Error('Invalid session format');
    }
    
    // Generate new ID to avoid conflicts
    session.id = generateSessionId();
    session.createdAt = Date.now();
    session.updatedAt = Date.now();
    
    // Save it
    const sessions = getAllSessions();
    sessions.unshift(session);
    
    while (sessions.length > MAX_SESSIONS) {
      sessions.pop();
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    updateMetadataCache(sessions);
    
    return session;
  } catch {
    return null;
  }
}

/**
 * Get storage usage information
 */
export function getStorageInfo(): {
  sessionCount: number;
  estimatedSize: number;
  maxSessions: number;
} {
  const sessions = getAllSessions();
  const stored = localStorage.getItem(STORAGE_KEY) || '';
  
  return {
    sessionCount: sessions.length,
    estimatedSize: new Blob([stored]).size,
    maxSessions: MAX_SESSIONS
  };
}

/**
 * Clear all sessions
 */
export function clearAllSessions(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(METADATA_KEY);
}

/**
 * Search sessions by name or tags
 */
export function searchSessions(query: string): SessionMetadata[] {
  const metadata = getSessionMetadata();
  const lowerQuery = query.toLowerCase();
  
  return metadata.filter(s => 
    s.name.toLowerCase().includes(lowerQuery) ||
    s.tags?.some(t => t.toLowerCase().includes(lowerQuery))
  );
}
