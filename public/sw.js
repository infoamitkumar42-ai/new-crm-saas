// Service Worker for Push Notifications

self.addEventListener('install', () => {
  console.log('[SW] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  const data = event.data ? event.data.json() : {};
  
  event.waitUntil(
    self.registration.showNotification(data.title || '🔥 New Lead!', {
      body: data.body || 'You have a new lead',
      tag: data.tag || 'lead',
      vibrate: [200, 100, 200],
      requireInteraction: true
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
