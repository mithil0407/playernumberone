type QuizPhotoKey = 'fullBody' | 'headshot';

const DB_NAME = 'uae-style-quiz';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const saveQuizPhoto = async (key: QuizPhotoKey, file: File) => {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(file, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getQuizPhoto = async (key: QuizPhotoKey): Promise<File | null> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve((request.result as File) || null);
    request.onerror = () => reject(request.error);
  });
};

export const clearQuizPhotos = async () => {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};
