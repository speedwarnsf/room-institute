/**
 * House & Room Storage Service
 * 
 * Manages rooms with per-room design history (LookbookEntry[]).
 * Uses Supabase when logged in, falls back to localStorage for anonymous users.
 * On login, migrates any localStorage rooms to Supabase.
 */

import { Room, House, LookbookEntry } from '../types';
import { supabase, getCurrentUser } from './auth';
import { uploadVisualizationImage } from './imageStorage';

const HOUSE_KEY = 'room-institute-house';
const THUMBNAIL_MAX = 200;
const MIGRATED_KEY = 'room-institute-rooms-migrated';

// ============================================================================
// HELPERS
// ============================================================================

async function isLoggedIn(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

function loadHouseRaw(): House | null {
  try {
    const raw = localStorage.getItem(HOUSE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistHouseLocal(house: House): void {
  try {
    const slim: House = {
      ...house,
      rooms: house.rooms.map(room => ({
        ...room,
        sourceImage: undefined,
        designs: room.designs.map(d => ({
          ...d,
          option: {
            ...d.option,
            visualizationImage: undefined,
            visualizationThumb: d.option.visualizationThumb,
          },
        })),
      })),
    };
    localStorage.setItem(HOUSE_KEY, JSON.stringify(slim));
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      console.warn('houseRoomStorage: quota exceeded, trimming oldest rooms');
      house.rooms = house.rooms.slice(0, 10);
      persistHouseLocal(house);
    }
  }
}

/**
 * Generate a small thumbnail from a base64 data URL
 */
function generateThumb(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(THUMBNAIL_MAX / img.width, THUMBNAIL_MAX / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function createDefaultHouse(): House {
  return {
    id: `house-${Date.now()}`,
    name: 'Our Home',
    rooms: [],
    createdAt: Date.now(),
  };
}

// ============================================================================
// SUPABASE HELPERS
// ============================================================================

/** Strip large base64 from designs before saving to Supabase */
async function stripDesignsForDb(designs: LookbookEntry[], roomId: string): Promise<LookbookEntry[]> {
  const results = await Promise.all(designs.map(async (d) => {
    let vizUrl = d.option.visualizationImage;
    
    // If it's base64 data, upload to storage and get URL
    if (vizUrl && !vizUrl.startsWith('http')) {
      const uploaded = await uploadVisualizationImage(vizUrl, roomId, d.id);
      vizUrl = uploaded || undefined;
    }
    
    return {
      ...d,
      option: {
        ...d.option,
        visualizationImage: vizUrl,
        visualizationThumb: d.option.visualizationThumb,
      },
    };
  }));
  return results;
}

async function roomToRow(room: Room, userId: string) {
  return {
    id: room.id,
    user_id: userId,
    name: room.name,
    source_image: room.sourceImage || null,
    source_image_thumb: room.sourceImageThumb || null,
    designs: await stripDesignsForDb(room.designs, room.id),
    created_at: new Date(room.createdAt).toISOString(),
    updated_at: new Date(room.updatedAt).toISOString(),
  };
}

function rowToRoom(row: any): Room {
  return {
    id: row.id,
    name: row.name,
    sourceImage: row.source_image || undefined,
    sourceImageThumb: row.source_image_thumb || undefined,
    designs: row.designs || [],
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

// ============================================================================
// MIGRATION: localStorage -> Supabase on login
// ============================================================================

export async function migrateLocalRoomsToSupabase(): Promise<void> {
  const userId = await isLoggedIn();
  if (!userId) return;

  // Only migrate once per user
  const migratedFor = localStorage.getItem(MIGRATED_KEY);
  if (migratedFor === userId) return;

  const house = loadHouseRaw();
  if (!house || house.rooms.length === 0) {
    localStorage.setItem(MIGRATED_KEY, userId);
    return;
  }

  // Upsert all local rooms to Supabase
  const rows = house.rooms.map(r => roomToRow(r, userId));
  const { error } = await supabase
    .from('rooms')
    .upsert(rows, { onConflict: 'id' });

  if (!error) {
    localStorage.setItem(MIGRATED_KEY, userId);
    // Clear localStorage rooms after successful migration
    localStorage.removeItem(HOUSE_KEY);
  } else {
    console.warn('houseRoomStorage: migration failed', error);
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function getHouse(): House {
  const existing = loadHouseRaw();
  if (existing) return existing;
  const house = createDefaultHouse();
  persistHouseLocal(house);
  return house;
}

export async function getRooms(): Promise<Room[]> {
  const userId = await isLoggedIn();
  if (userId) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (!error && data) {
      return data.map(rowToRoom);
    }
    console.warn('houseRoomStorage: Supabase getRooms failed, falling back', error);
  }
  return getHouse().rooms;
}

export async function getRoom(id: string): Promise<Room | null> {
  const userId = await isLoggedIn();
  if (userId) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (!error && data) {
      return rowToRoom(data);
    }
    if (error && error.code !== 'PGRST116') {
      console.warn('houseRoomStorage: Supabase getRoom failed, falling back', error);
    }
  }
  return getHouse().rooms.find(r => r.id === id) || null;
}

export async function saveRoom(room: Room): Promise<void> {
  // Generate thumbnail if we have a source image but no thumb
  if (room.sourceImage && !room.sourceImageThumb) {
    room.sourceImageThumb = await generateThumb(room.sourceImage);
  }

  const userId = await isLoggedIn();
  if (userId) {
    // Upload source image to storage if it's base64
    if (room.sourceImage && !room.sourceImage.startsWith('http')) {
      try {
        const { uploadVisualizationImage } = await import('./imageStorage');
        const url = await uploadVisualizationImage(
          room.sourceImage.replace(/^data:image\/\w+;base64,/, ''),
          room.id,
          'source'
        );
        if (url) room.sourceImage = url;
      } catch {}
    }

    const { error } = await supabase
      .from('rooms')
      .upsert(await roomToRow(room, userId), { onConflict: 'id' });
    if (error) {
      console.warn('houseRoomStorage: Supabase saveRoom failed, falling back', error);
    } else {
      return;
    }
  }

  // localStorage fallback
  const house = getHouse();
  const idx = house.rooms.findIndex(r => r.id === room.id);
  if (idx >= 0) {
    house.rooms[idx] = room;
  } else {
    house.rooms.unshift(room);
  }
  persistHouseLocal(house);
}

export function updateRoom(id: string, updates: Partial<Room>): void {
  // Note: this remains sync for localStorage; callers needing Supabase
  // should use saveRoom instead. Kept for backward compat.
  const house = getHouse();
  const idx = house.rooms.findIndex(r => r.id === id);
  if (idx < 0) return;
  const existing = house.rooms[idx]!;
  house.rooms[idx] = { ...existing, ...updates, updatedAt: Date.now() };
  persistHouseLocal(house);
}

export async function deleteRoom(id: string): Promise<void> {
  const userId = await isLoggedIn();
  if (userId) {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      console.warn('houseRoomStorage: Supabase deleteRoom failed', error);
    }
  }

  // Also remove from localStorage if present
  const house = getHouse();
  house.rooms = house.rooms.filter(r => r.id !== id);
  persistHouseLocal(house);
}

export async function saveDesignToRoom(roomId: string, entry: LookbookEntry): Promise<void> {
  // Get the current room (from Supabase or localStorage)
  const room = await getRoom(roomId);
  if (!room) return;

  // Avoid duplicates
  if (room.designs.find(d => d.id === entry.id)) return;

  // Generate a thumbnail from the visualization image before it gets stripped
  const vizImage = entry.option.visualizationImage;
  const entryWithThumb: LookbookEntry = {
    ...entry,
    option: {
      ...entry.option,
      visualizationThumb: vizImage
        ? await generateThumb(`data:image/png;base64,${vizImage}`)
        : entry.option.visualizationThumb,
    },
  };

  room.designs.push(entryWithThumb);
  room.updatedAt = Date.now();

  await saveRoom(room);
}

export function createRoom(name: string, sourceImage?: string): Room {
  return {
    id: `room-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    sourceImage,
    designs: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
