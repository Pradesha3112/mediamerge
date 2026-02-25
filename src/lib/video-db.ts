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

export interface AudioPoolEntry {
  id: string;
  file: File;
  name: string;
  size: number;
  timestamp: number;
}

const DB_NAME = 'MediaFusionDB';
const VIDEO_STORE = 'VideoHistory';
const AUDIO_STORE = 'AudioPool';
const DB_VERSION = 2;

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(VIDEO_STORE)) {
        db.createObjectStore(VIDEO_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Video History Methods
export async function saveVideoEntry(entry: VideoHistoryEntry) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VIDEO_STORE, 'readwrite');
    const store = transaction.objectStore(VIDEO_STORE);
    const request = store.put(entry);
    request.onsuccess = () => resolve(entry);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllVideoEntries(): Promise<VideoHistoryEntry[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VIDEO_STORE, 'readonly');
    const store = transaction.objectStore(VIDEO_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.timestamp - a.timestamp));
    request.onerror = () => reject(request.error);
  });
}

export async function deleteVideoEntry(id: string) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VIDEO_STORE, 'readwrite');
    const store = transaction.objectStore(VIDEO_STORE);
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// Audio Pool Methods
export async function saveAudioEntry(entry: AudioPoolEntry) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(AUDIO_STORE, 'readwrite');
    const store = transaction.objectStore(AUDIO_STORE);
    const request = store.put(entry);
    request.onsuccess = () => resolve(entry);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllAudioEntries(): Promise<AudioPoolEntry[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(AUDIO_STORE, 'readonly');
    const store = transaction.objectStore(AUDIO_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.timestamp - a.timestamp));
    request.onerror = () => reject(request.error);
  });
}

export async function deleteAudioEntry(id: string) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(AUDIO_STORE, 'readwrite');
    const store = transaction.objectStore(AUDIO_STORE);
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}
