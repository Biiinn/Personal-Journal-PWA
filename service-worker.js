// ============================================================
// SERVICE WORKER — makes the app installable and offline-capable
// ============================================================
//
// A Service Worker is a small JavaScript program the browser runs
// in the background, separate from the page itself. It can intercept
// network requests (via the 'fetch' event below) and decide whether
// the response should come from the network or from a local cache.
// This file is what keeps the app working without an internet connection.
//
// IMPORTANT: bump the version number below every time you change
// index.html, style.css, script.js, or anything in translations/,
// utils/, or components/. That's what tells the browser a new
// version exists and that old cached files should be replaced.

const CACHE_VERSION = 'v7';
const CACHE_NAME = 'journal-cache-' + CACHE_VERSION;

// Every file needed for the app to work fully offline.
// This is called the "app shell" — the framework around the app.
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.webmanifest',
  './translations/en.js',
  './translations/sv.js',
  './utils/i18n.js',
  './utils/storage.js',
  './utils/imageStore.js',
  './components/onboarding.js',
  './components/settings.js',
  './components/gallery.js',
  './components/focusMode.js',
  './components/confirmDialog.js',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
  './icons/icon-512x512-maskable.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32x32.png',
  './icons/favicon-16x16.png'
];

// ---------- INSTALL ----------
// Runs ONCE when the Service Worker is first registered, or when a
// new version of this file is detected by the browser. We download
// and store the entire app shell in the cache right away.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  // We deliberately do NOT call self.skipWaiting() here. We want an
  // already-open tab to choose WHEN it switches to the new version
  // (via the "Update" button in the app), not have it swapped out
  // from under the user mid-entry.
});

// ---------- ACTIVATE ----------
// Runs when the new Service Worker takes over. This is where we
// clean up old cache versions so storage doesn't grow unbounded.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ---------- MESSAGE FROM THE APP ----------
// script.js sends this message when the user taps the "Update" button
// in the update banner. It makes the new version take over immediately
// instead of waiting for every tab to be closed first.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ---------- FETCH ----------
// Intercepts EVERY network request the app makes. The strategy
// differs depending on what's being requested:
//
// 1) Page loads (navigation, e.g. opening the app): "network-first".
//    Try to fetch fresh content from the network. If that fails
//    (offline), fall back to the cached app shell.
//
// 2) Everything else (CSS, JS, icons, fonts): "cache-first".
//    These files rarely change, so we serve the cached version
//    immediately for speed, and refresh the cache in the background
//    when the network is available.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const isNavigation = req.mode === 'navigate';

  if (isNavigation) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          // Only cache valid responses (avoids storing broken/failed requests)
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached); // offline and nothing cached: give up quietly

      // Cache-first: respond immediately with the cached version if
      // one exists, otherwise wait for the network.
      return cached || networkFetch;
    })
  );
});
