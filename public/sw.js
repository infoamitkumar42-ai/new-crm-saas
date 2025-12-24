self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'New Lead!', body: event.data.text() };
    }
  }

  const options = {
    body: data.body || 'You have a new lead waiting.',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [300, 100, 300, 100, 300], // Stronger vibration
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Open Dashboard' }
    ],
    tag: 'new-lead', // Prevents multiple notifications stacking
    renotify: true   // Sound/Vibrate again if tag is same
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🔥 New Lead Received!', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data.url);
    })
  );
});
