
// LeadFlow Service Worker v5 - NETWORK FIRST ONLY (Feb 7 Emergency Fix)
const CACHE_NAME = 'leadflow-v5-emergency';

// Only cache static assets
const urlsToCache = [
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  console.log('SW v5 installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('SW v5 activating...');
  // Delete ALL old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});

// NETWORK FIRST FOR EVERYTHING - no caching issues
self.addEventListener('fetch', (event) => {
  // Always go to network first
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        // Only use cache as absolute fallback for offline
        return caches.match(event.request);
      })
  );
});
