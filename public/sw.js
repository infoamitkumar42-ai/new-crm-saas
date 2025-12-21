// public/sw.js

const CACHE_NAME = 'leadflow-v1';

// Install Event
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Installing...');
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  console.log('✅ [SW] Activated');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean old caches
      caches.keys().then(keys => {
        return Promise.all(
          keys.filter(key => key !== CACHE_NAME)
              .map(key => caches.delete(key))
        );
      })
    ])
  );
});

// Push Event (for future Push Notifications)
self.addEventListener('push', (event) => {
  console.log('📩 [SW] Push received');
  
  let data = { title: 'New Notification', body: 'You have a new message' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'default',
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'open', title: '📂 Open App' },
      { action: 'dismiss', title: '❌ Dismiss' }
    ],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Message Event (for receiving messages from main thread)
self.addEventListener('message', (event) => {
  console.log('💬 [SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    
    event.waitUntil(
      self.registration.showNotification(title, {
        body: options.body || '',
        icon: options.icon || '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag: options.tag || 'lead-' + Date.now(),
        renotify: true,
        requireInteraction: false,
        data: {
          url: options.url || '/',
          leadId: options.leadId
        }
      })
    );
  }
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ [SW] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // अगर app पहले से open है तो focus करो
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: event.notification.data
            });
            return client.focus();
          }
        }
        // वरना नई window खोलो
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification Close Event
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 [SW] Notification closed');
});

// Fetch Event (Optional - for offline support)
self.addEventListener('fetch', (event) => {
  // Let it pass through for now
});
