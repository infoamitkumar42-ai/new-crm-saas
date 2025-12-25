// Updated Service Worker - Better reliability
const CACHE_NAME = 'leadflow-v1';

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('[SW] Claimed clients');
    })
  );
});

// Push event - OPTIMIZED
self.addEventListener('push', (event) => {
  console.log('[SW] Push received at', new Date().toLocaleTimeString());
  
  let data = { title: '🔥 New Lead!', body: 'Check your dashboard' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.log('[SW] Parse error, using default');
    }
  }

  const options = {
    body: data.body || 'You have a new lead.',
    icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    badge: data.badge || 'https://cdn-icons-png.flaticon.com/512/891/891462.png',
    vibrate: data.vibrate || [300, 100, 300],
    tag: data.tag || 'lead-notification',
    renotify: true,
    requireInteraction: true,  // Stays until user dismisses
    silent: false,
    timestamp: Date.now(),
    data: data.data || { url: '/leads' },
    actions: [
      { action: 'open', title: '📂 Open' },
      { action: 'dismiss', title: '✖️ Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🔥 New Lead!', options)
      .then(() => console.log('[SW] Notification shown'))
      .catch(err => console.error('[SW] Show error:', err))
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/leads';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(c => c.navigate(urlToOpen));
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Keep alive (prevent SW from sleeping)
self.addEventListener('message', (event) => {
  if (event.data === 'KEEP_ALIVE') {
    console.log('[SW] Keep alive ping');
    event.ports[0].postMessage({ alive: true });
  }
});
