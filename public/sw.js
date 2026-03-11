// public/sw.js
// ╔════════════════════════════════════════════════════════════╗
// ║  LeadFlow Service Worker v6 - Background Push Fixed       ║
// ║  Status: PRODUCTION READY                                 ║
// ║  Changes: Sound ON, RequireInteraction, Renotify, URL fix ║
// ╚════════════════════════════════════════════════════════════╝

const CACHE_NAME = 'leadflow-v6';

// -----------------------------------------------------------------------
// 1. INSTALL
// -----------------------------------------------------------------------
self.addEventListener('install', (event) => {
  console.log('[SW v6] Installing...');
  self.skipWaiting();
});

// -----------------------------------------------------------------------
// 2. ACTIVATE - Clean old caches
// -----------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  console.log('[SW v6] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW v6] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// -----------------------------------------------------------------------
// PASSIVE MODE: No fetch listener.
// Browser handles all requests natively (Network Only).
// Prevents "AbortError" and SW-related fetch failures.
// -----------------------------------------------------------------------

// -----------------------------------------------------------------------
// 3. 🔔 PUSH HANDLER - Background Notifications
// -----------------------------------------------------------------------
self.addEventListener('push', (event) => {
  console.log('[SW v6] 📬 Push Received!');

  if (!event.data) {
    console.log('[SW v6] ❌ Empty push data, showing fallback');
    event.waitUntil(
      self.registration.showNotification('🔥 LeadFlow Alert', {
        body: 'You have a new activity.',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        requireInteraction: true,
        silent: false,
        renotify: true,
        tag: 'fallback-' + Date.now()
      })
    );
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    // Non-JSON push data
    payload = {
      title: '🔥 LeadFlow Alert',
      body: event.data.text() || 'New activity on your dashboard.'
    };
  }

  console.log('[SW v6] 📦 Payload:', JSON.stringify(payload));

  const title = payload.title || '🔥 New Lead Received!';

  const options = {
    body: payload.body || 'Open the app to see details.',
    icon: payload.icon || '/icon-192x192.png',
    badge: payload.badge || '/icon-192x192.png',

    // 🔊 SOUND & VIBRATION - Ye pehle missing the
    vibrate: [300, 100, 300, 100, 300],
    silent: false,

    // 📌 PERSISTENCE - Auto dismiss nahi hoga
    requireInteraction: true,

    // 🔄 RENOTIFY - Har push pe sound bajegi
    renotify: true,
    tag: payload.tag || 'lead-' + Date.now(),

    // 📂 CLICK DATA - URL extraction fix
    data: {
      url: payload.data?.url || payload.url || '/',
      leadId: payload.data?.leadId || null,
      timestamp: Date.now()
    },

    // 🖱️ ACTION BUTTONS
    actions: [
      { action: 'open', title: '📂 View Lead' },
      { action: 'dismiss', title: '✖ Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// -----------------------------------------------------------------------
// 4. 🖱️ NOTIFICATION CLICK HANDLER
// -----------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  console.log('[SW v6] 🖱️ Notification clicked, action:', event.action);
  event.notification.close();

  // Dismiss action - just close
  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/';
  const fullUrl = urlToOpen.startsWith('http')
    ? urlToOpen
    : self.location.origin + urlToOpen;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If app already open, focus and navigate
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.navigate(fullUrl).then(() => client.focus());
          }
        }
        // Otherwise open new window
        return self.clients.openWindow(fullUrl);
      })
  );
});

// -----------------------------------------------------------------------
// 5. 🛠️ MESSAGE HANDLER - Keep alive + Skip waiting
// -----------------------------------------------------------------------
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  // Keep alive ping response
  if (event.data === 'KEEP_ALIVE') {
    // SW is alive, no action needed
  }
});
