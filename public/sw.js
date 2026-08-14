// Service Worker for Elyssa ERP - Forced Cache Invalidation & Direct Routing
const CACHE_NAME = 'elyssa-erp-cache-v2';

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing and forcing skipWaiting.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating, clearing caches and claiming clients.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[Service Worker] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Avoid intercepting API requests to prevent issues with request bodies in sandboxed environments
  if (event.request.url.includes('/api/')) {
    return;
  }
  // Direct network routing to bypass any service worker cache proxy
  event.respondWith(fetch(event.request));
});
