// ============================================================
// STORAGE SHIM — makes the app work as a fully standalone PWA
// ============================================================
// This app was originally built to run inside Claude's artifact
// environment, which provides a built-in `window.storage` API
// (get/set/delete/list, all async, all Promise-based).
//
// When the app runs anywhere else — as this installable PWA,
// opened via Live Server or hosted on GitHub Pages — that API
// doesn't exist. So if it's missing, we build an equivalent
// version ourselves backed by the browser's own localStorage.
// Every other file in this project just calls `window.storage.get(...)`
// etc. and never needs to know or care which backend is actually
// running underneath.
if (!window.storage) {
  window.storage = {
    async get(key) {
      const val = localStorage.getItem(key);
      return val === null ? null : { key, value: val, shared: false };
    },
    async set(key, value) {
      localStorage.setItem(key, value);
      return { key, value, shared: false };
    },
    async delete(key) {
      const existed = localStorage.getItem(key) !== null;
      localStorage.removeItem(key);
      return { key, deleted: existed, shared: false };
    },
    async list(prefix) {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!prefix || k.startsWith(prefix)) keys.push(k);
      }
      return { keys, prefix, shared: false };
    }
  };
}
