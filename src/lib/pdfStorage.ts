/**
 * Native IndexedDB PDF Storage for offline, standalone, and client-side PDF hosting
 * Supports storing large PDF files directly in the browser with zero cloud accounts or Cloudflare needed.
 */

const DB_NAME = 'FlipbookStorageDB';
const DB_VERSION = 1;
const STORE_NAME = 'pdf_files';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Stores a PDF File / Blob in IndexedDB and returns a persistent idb URI
 */
export async function savePdfToStorage(key: string, file: Blob | File): Promise<string> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(file, key);

    request.onsuccess = () => resolve(`idb://${key}`);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves a PDF Blob from IndexedDB by its key or idb URI
 */
export async function getPdfFromStorage(keyOrUri: string): Promise<Blob | null> {
  const key = keyOrUri.replace(/^idb:\/\//, '');
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Removes a PDF file from IndexedDB
 */
export async function deletePdfFromStorage(keyOrUri: string): Promise<void> {
  const key = keyOrUri.replace(/^idb:\/\//, '');
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
