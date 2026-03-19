/**
 * Room Storage Service for ZenSpace
 * 
 * Enhanced storage that treats each room as a project with multiple designs,
 * a chosen design, and purchase progress tracking.
 */

import { UploadedImage, DesignOption, DesignAnalysis, ShoppingListData } from '../types';
import { generateThumbnail } from './sessionStorage';

// ============================================================================
// TYPES
// ============================================================================

export interface PurchaseProgress {
  /** Item IDs that have been purchased */
  purchasedIds: string[];
  /** Total number of items */
  totalItems: number;
}

export interface SavedDesign {
  /** Design index (0-2) */
  index: number;
  /** Design name */
  name: string;
  /** Mood description */
  mood: string;
  /** Color palette */
  palette: string[];
  /** Key changes */
  keyChanges: string[];
  /** Visualization image (base64) */
  visualizationImage?: string;
  /** Shopping list for this design */
  shoppingList?: ShoppingListData;
  /** Purchase progress */
  purchaseProgress: PurchaseProgress;
}

export interface SavedRoom {
  /** Unique room ID */
  id: string;
  /** User-given name */
  name: string;
  /** Created timestamp */
  createdAt: number;
  /** Last modified */
  updatedAt: number;
  /** Thumbnail (small base64 JPEG) */
  thumbnail: string;
  /** Original image data URL */
  imageDataUrl: string;
  /** Room reading from design analysis */
  roomReading: string;
  /** All saved designs for this room */
  designs: SavedDesign[];
  /** Index of the chosen design (-1 = none chosen) */
  chosenDesignIndex: number;
  /** Tags */
  tags: string[];
}

export interface RoomMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  thumbnail: string;
  designCount: number;
  chosenDesignName: string | null;
  completionPercent: number;
  tags: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ROOMS_KEY = 'zenspace_rooms';
const MAX_ROOMS = 20;

// ============================================================================
// HELPERS
// ============================================================================

function getAllRooms(): SavedRoom[] {
  try {
    const raw = localStorage.getItem(ROOMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistRooms(rooms: SavedRoom[]): void {
  try {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      // Drop oldest rooms to make space
      while (rooms.length > 5) rooms.pop();
      localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
    }
  }
}

function calcCompletion(designs: SavedDesign[], chosenIndex: number): number {
  if (chosenIndex < 0 || chosenIndex >= designs.length) return 0;
  const d = designs[chosenIndex];
  if (!d || d.purchaseProgress.totalItems === 0) return 0;
  return Math.round((d.purchaseProgress.purchasedIds.length / d.purchaseProgress.totalItems) * 100);
}

function designFromOption(opt: DesignOption, index: number, shoppingList?: ShoppingListData): SavedDesign {
  return {
    index,
    name: opt.name,
    mood: opt.mood,
    palette: opt.palette,
    keyChanges: opt.keyChanges,
    visualizationImage: opt.visualizationImage,
    shoppingList: shoppingList || undefined,
    purchaseProgress: {
      purchasedIds: [],
      totalItems: shoppingList?.items?.length || 0,
    },
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function getRoomMetadata(): RoomMetadata[] {
  return getAllRooms().map(r => ({
    id: r.id,
    name: r.name,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    thumbnail: r.thumbnail,
    designCount: r.designs.length,
    chosenDesignName: r.chosenDesignIndex >= 0 ? r.designs[r.chosenDesignIndex]?.name || null : null,
    completionPercent: calcCompletion(r.designs, r.chosenDesignIndex),
    tags: r.tags,
  }));
}

export function getRoom(id: string): SavedRoom | null {
  return getAllRooms().find(r => r.id === id) || null;
}

export async function saveRoom(
  image: UploadedImage,
  designAnalysis: DesignAnalysis,
  chosenDesignIndex: number,
  shoppingList?: ShoppingListData,
  existingRoomId?: string,
  roomName?: string,
): Promise<SavedRoom> {
  const rooms = getAllRooms();
  const thumbnail = await generateThumbnail(image.dataUrl);
  const now = Date.now();

  // Build designs from the 3 options
  const designs: SavedDesign[] = designAnalysis.options.map((opt, i) =>
    designFromOption(opt, i, i === chosenDesignIndex ? shoppingList : undefined)
  );

  // Merge purchase progress from existing room if updating
  const existing = existingRoomId ? rooms.find(r => r.id === existingRoomId) : null;
  if (existing) {
    for (const ed of existing.designs) {
      const match = designs.find(d => d.index === ed.index);
      if (match) {
        match.purchaseProgress = ed.purchaseProgress;
        if (!match.shoppingList && ed.shoppingList) match.shoppingList = ed.shoppingList;
      }
    }
  }

  const room: SavedRoom = {
    id: existingRoomId || `room_${now}_${Math.random().toString(36).slice(2, 9)}`,
    name: roomName || autoRoomName(designAnalysis),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    thumbnail,
    imageDataUrl: image.dataUrl,
    roomReading: designAnalysis.roomReading,
    designs,
    chosenDesignIndex,
    tags: existing?.tags || [],
  };

  const idx = rooms.findIndex(r => r.id === room.id);
  if (idx >= 0) {
    rooms[idx] = room;
  } else {
    rooms.unshift(room);
    while (rooms.length > MAX_ROOMS) rooms.pop();
  }

  persistRooms(rooms);
  return room;
}

function autoRoomName(da: DesignAnalysis): string {
  const text = da.roomReading.toLowerCase();
  const types = ['bedroom', 'living room', 'kitchen', 'bathroom', 'office', 'dining room', 'studio', 'closet', 'garage'];
  for (const t of types) {
    if (text.includes(t)) {
      const d = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${t.charAt(0).toUpperCase() + t.slice(1)} — ${d}`;
    }
  }
  const d = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return `Room — ${d}`;
}

export function deleteRoom(id: string): boolean {
  const rooms = getAllRooms();
  const idx = rooms.findIndex(r => r.id === id);
  if (idx < 0) return false;
  rooms.splice(idx, 1);
  persistRooms(rooms);
  return true;
}

export function renameRoom(id: string, name: string): boolean {
  const rooms = getAllRooms();
  const room = rooms.find(r => r.id === id);
  if (!room) return false;
  room.name = name;
  room.updatedAt = Date.now();
  persistRooms(rooms);
  return true;
}

export function updatePurchaseProgress(roomId: string, designIndex: number, purchasedIds: string[]): boolean {
  const rooms = getAllRooms();
  const room = rooms.find(r => r.id === roomId);
  if (!room) return false;
  const design = room.designs.find(d => d.index === designIndex);
  if (!design) return false;
  design.purchaseProgress.purchasedIds = purchasedIds;
  room.updatedAt = Date.now();
  persistRooms(rooms);
  return true;
}

export function setChosenDesign(roomId: string, designIndex: number): boolean {
  const rooms = getAllRooms();
  const room = rooms.find(r => r.id === roomId);
  if (!room) return false;
  room.chosenDesignIndex = designIndex;
  room.updatedAt = Date.now();
  persistRooms(rooms);
  return true;
}

export function addShoppingListToDesign(roomId: string, designIndex: number, shoppingList: ShoppingListData): boolean {
  const rooms = getAllRooms();
  const room = rooms.find(r => r.id === roomId);
  if (!room) return false;
  const design = room.designs.find(d => d.index === designIndex);
  if (!design) return false;
  design.shoppingList = shoppingList;
  design.purchaseProgress.totalItems = shoppingList.items.length;
  room.updatedAt = Date.now();
  persistRooms(rooms);
  return true;
}

export function getRoomCount(): number {
  return getAllRooms().length;
}
