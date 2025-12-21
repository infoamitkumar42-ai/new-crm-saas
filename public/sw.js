self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  
  let data = { title: 'New Lead!', body: 'Check app.', url: '/' };

  // Server se data parse karo
  if (event.data) {
    try {
      data = event.data.json();
    } catch(e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/vite.svg',
    badge: '/vite.svg',
    vibrate: [200, 100, 200],
    tag: 'lead-notification',
    renotify: true,
    data: { url: data.url }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Notification par click karne par app kholo
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Agar app khula hai to focus karo
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Agar band hai to kholo
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
