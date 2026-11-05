/*
 * Thuto Mobile service worker — offline app shell.
 *
 * Caching contract (keep this honest when touching it):
 *   /assets/*           hashed, immutable build output  -> CACHE-FIRST
 *   navigations         the SPA index                   -> NETWORK-FIRST,
 *                                                          offline falls back
 *                                                          to the cached shell
 *   /api/*              session-bound, fail-closed data -> NEVER CACHED.
 *                         A cached /api response could show one student's
 *                         grades to another on a shared kiosk — so cache
 *                         nothing, ever, for any reason.
 *   everything else     same-origin small files (icons,
 *                       manifest)                    -> stale-while-revalidate
 *   cross-origin        fonts, thuto.nul.ls            -> LEAVE ALONE
 */

const VERSION = 'v1';
const SHELL_CACHE = `thuto-shell-${VERSION}`;
const ASSET_CACHE = `thuto-assets-${VERSION}`;
const RUNTIME_CACHE = `thuto-runtime-${VERSION}`;

const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      // skipWaiting on installed so the new worker takes over the same tick
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Wipe every cache whose version doesn't match — old shells die with
      // their build so stale hashed assets can never resurrect.
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => ![SHELL_CACHE, ASSET_CACHE, RUNTIME_CACHE].includes(n))
          .map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only same-origin GETs are our business.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  const path = new URL(request.url).pathname;

  // ---- /api/* : NEVER CACHED (session-bound data, fail-closed) ----
  if (path.startsWith('/api/')) {
    return; // network is the only source; offline => app handles the error
  }

  // ---- Hashed build assets: cache-first (they are immutable) ----
  if (path.startsWith('/assets/')) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })
    );
    return;
  }

  // ---- SPA navigations: network-first, cached shell as offline fallback ----
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Keep the freshest index in the shell cache for the offline load.
          caches.open(SHELL_CACHE).then((cache) => cache.put('/', res.clone()));
          return res;
        })
        .catch(async () => {
          const shell = await caches.open(SHELL_CACHE);
          return (await shell.match('/')) || Response.error();
        })
    );
    return;
  }

  // ---- Everything else same-origin: stale-while-revalidate ----
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(async (cache) => {
      const hit = await cache.match(request);
      const network = fetch(request)
        .then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        })
        .catch(() => hit || Response.error());
      return hit || network;
    })
  );
});
