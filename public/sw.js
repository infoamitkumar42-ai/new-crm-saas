
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



// -----------------------------------------------------------------------
// PASSIVE MODE: No fetch listener.
// This allows the browser to handle all requests natively (Network Only).
// This prevents "AbortError" and other SW-related fetch failures.
// -----------------------------------------------------------------------

// 3. 🚀 BACKGROUND PUSH LISTENER (Restored Feb 12)
self.addEventListener('push', (event) => {
  console.log('📬 [SW] Push Received!');

  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || '🔥 New Lead Received!';
    const options = {
      body: payload.body || 'Open the app to see details.',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [200, 100, 200],
      data: {
        url: payload.url || '/'
      },
      actions: [
        { action: 'open', title: 'View Dashboard' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('❌ [SW] Push Payload Error:', err);
    // Fallback notification for non-JSON payloads
    event.waitUntil(
      self.registration.showNotification('🔥 LeadFlow Alert', {
        body: 'You have a new activity on your dashboard.',
        icon: '/icon-192x192.png'
      })
    );
  }
});

// 4. 🖱️ NOTIFICATION CLICK HANDLER
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. If an app window is already open, just focus it
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // 2. Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// 5. 🛠️ SELF-HEALING: Clear old caches if version changes
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
