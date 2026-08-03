// ============================================================
// IMAGE STORE — binary photo storage backed by IndexedDB
// ============================================================
//
// Why images live here instead of in window.storage/localStorage:
// localStorage is capped at roughly 5-10MB TOTAL per site, shared
// between every piece of data the app saves — including all of your
// journal text. Photos, even compressed, add up fast; a handful of
// journal entries with a few photos each could fill that entire
// quota and break saving/loading for every entry, not just the ones
// with photos. IndexedDB has a much larger quota (commonly hundreds
// of MB, sometimes gigabytes, browser-dependent), stores binary Blobs
// natively (no base64 text-encoding overhead, which alone costs ~33%
// extra size), and is asynchronous by design so large reads/writes
// never freeze the interface the way synchronous localStorage can.
//
// The journal entry itself (in localStorage, via window.storage)
// only ever stores a small ordered array of image IDs — e.g.
// entry.photos = ["a1b2c3", "d4e5f6"]. The actual image bytes live
// here, keyed by that same ID. This keeps entries themselves tiny
// and fast to load, while photos scale independently.

const IMAGE_DB_NAME = 'journal-images';
const IMAGE_DB_VERSION = 1;
const IMAGE_STORE_NAME = 'images';

let _dbPromise = null;

function openImageDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }
    const req = indexedDB.open(IMAGE_DB_NAME, IMAGE_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        const store = db.createObjectStore(IMAGE_STORE_NAME, { keyPath: 'id' });
        store.createIndex('byEntryDate', 'entryDate', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

function generateImageId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'img-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
}

// Resize + compress an image File/Blob down to a reasonable size
// before it's stored. Returns a Promise<Blob> (JPEG).
function compressImageFile(file, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    // Safety net: if anything below hangs for an unexpected reason (a huge
    // image, a browser quirk, whatever), fail loudly after 15s instead of
    // leaving the caller waiting forever with no feedback.
    const safetyTimer = setTimeout(() => reject(new Error('Image processing timed out.')), 15000);
    const finish = (fn) => (...args) => { clearTimeout(safetyTimer); fn(...args); };
    const resolveOnce = finish(resolve);
    const rejectOnce = finish(reject);

    const reader = new FileReader();
    reader.onerror = () => rejectOnce(reader.error || new Error('Could not read the file.'));
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => rejectOnce(new Error('Could not decode image.'));
      img.onload = () => {
        // Everything here used to run with no error handling at all — if
        // drawImage/getContext/toBlob ever threw, the promise just hung
        // forever with zero feedback. Wrapping it means a real failure
        // surfaces as a rejected promise instead of a silent freeze.
        try {
          const scale = Math.min(1, maxWidth / img.width);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) { rejectOnce(new Error('Canvas 2D context unavailable.')); return; }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) resolveOnce(blob); else rejectOnce(new Error('Compression produced no data.'));
          }, 'image/jpeg', quality);
        } catch (err) {
          rejectOnce(err);
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const ImageStore = {
  // Compress + store a single File, associated with a journal entry date.
  // Returns the new image's generated ID.
  // Store an already-processed Blob directly, skipping compression.
  // Used to migrate legacy single-photo (base64) entries into the gallery.
  async importBlob(entryDate, blob, order) {
    const db = await openImageDB();
    const id = generateImageId();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IMAGE_STORE_NAME, 'readwrite');
      tx.objectStore(IMAGE_STORE_NAME).put({ id, entryDate, blob, order, createdAt: Date.now() });
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  },

  async addImage(entryDate, file, order) {
    const blob = await compressImageFile(file);
    const db = await openImageDB();
    const id = generateImageId();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IMAGE_STORE_NAME, 'readwrite');
      tx.objectStore(IMAGE_STORE_NAME).put({ id, entryDate, blob, order, createdAt: Date.now() });
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  },

  // Fetch a single image's Blob by ID. Returns null if not found.
  async getImage(id) {
    const db = await openImageDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IMAGE_STORE_NAME, 'readonly');
      const req = tx.objectStore(IMAGE_STORE_NAME).get(id);
      req.onsuccess = () => resolve(req.result ? req.result.blob : null);
      req.onerror = () => reject(req.error);
    });
  },

  // Convenience: fetch a Blob and turn it into a displayable object URL.
  // Caller is responsible for revoking it (URL.revokeObjectURL) once
  // it's no longer shown, to avoid leaking memory.
  async getImageURL(id) {
    const blob = await ImageStore.getImage(id);
    return blob ? URL.createObjectURL(blob) : null;
  },

  async deleteImage(id) {
    const db = await openImageDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IMAGE_STORE_NAME, 'readwrite');
      tx.objectStore(IMAGE_STORE_NAME).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  // Delete every image belonging to a given entry date (not currently
  // wired to any UI action, but useful if entry deletion is added later).
  async deleteAllForEntry(entryDate) {
    const db = await openImageDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IMAGE_STORE_NAME, 'readwrite');
      const index = tx.objectStore(IMAGE_STORE_NAME).index('byEntryDate');
      const req = index.openCursor(IDBKeyRange.only(entryDate));
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) { cursor.delete(); cursor.continue(); }
      };
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }
};
