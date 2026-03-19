import { LookbookEntry } from '../types';

const LOOKBOOK_KEY = 'zenspace-lookbook';
const DB_NAME = 'zenspace-lookbook-db';
const DB_VERSION = 1;
const IMAGE_STORE = 'visualization-images';
const ROOM_IMAGE_KEY = '__room_image__';

// --- IndexedDB helpers ---

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE);
      }
    };
  });
}

export async function saveVisualizationImage(entryId: string, imageData: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(IMAGE_STORE, 'readwrite');
    const store = tx.objectStore(IMAGE_STORE);
    store.put(imageData, entryId);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn('Failed to save visualization image:', err);
  }
}

export async function loadAllVisualizationImages(entryIds: string[]): Promise<Map<string, string>> {
  const images = new Map<string, string>();
  try {
    const db = await openDB();
    const tx = db.transaction(IMAGE_STORE, 'readonly');
    const store = tx.objectStore(IMAGE_STORE);
    await Promise.all(entryIds.map(id => new Promise<void>((resolve) => {
      const request = store.get(id);
      request.onsuccess = () => {
        if (request.result) images.set(id, request.result);
        resolve();
      };
      request.onerror = () => resolve();
    })));
    db.close();
  } catch (err) {
    console.warn('Failed to load visualization images:', err);
  }
  return images;
}

async function clearVisualizationImages(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(IMAGE_STORE, 'readwrite');
    tx.objectStore(IMAGE_STORE).clear();
    await new Promise<void>((resolve) => { tx.oncomplete = () => resolve(); });
    db.close();
  } catch (err) {
    console.warn('Failed to clear visualization images:', err);
  }
}

// --- localStorage for metadata (strips images) ---

export function saveLookbook(entries: LookbookEntry[]): void {
  try {
    const slim = entries.map(e => ({
      ...e,
      option: {
        ...e.option,
        visualizationImage: undefined,
      },
    }));
    localStorage.setItem(LOOKBOOK_KEY, JSON.stringify(slim));
  } catch (err) {
    console.warn('Failed to save lookbook:', err);
  }
}

export function loadLookbook(): LookbookEntry[] | null {
  try {
    const data = localStorage.getItem(LOOKBOOK_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function clearLookbook(): Promise<void> {
  localStorage.removeItem(LOOKBOOK_KEY);
  await clearVisualizationImages();
}

// --- Room image via IndexedDB ---

export async function saveRoomImage(dataUrl: string): Promise<void> {
  await saveVisualizationImage(ROOM_IMAGE_KEY, dataUrl);
}

export async function loadRoomImage(): Promise<string | null> {
  const images = await loadAllVisualizationImages([ROOM_IMAGE_KEY]);
  return images.get(ROOM_IMAGE_KEY) || null;
}
