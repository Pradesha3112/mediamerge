'use client';

export interface VideoHistoryEntry {
  id: string;
  blob: Blob;
  thumbnail: string;
  duration: number;
  size: number;
  timestamp: number;
  name: string;
}

const DB_NAME = 'MediaFusionDB';
const STORE_NAME = 'VideoHistory';
const DB_VERSION = 1;

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveVideoEntry(entry: VideoHistoryEntry) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(entry);
    request.onsuccess = () => resolve(entry);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllVideoEntries(): Promise<VideoHistoryEntry[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.timestamp - a.timestamp));
    request.onerror = () => reject(request.error);
  });
}

export async function deleteVideoEntry(id: string) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}