// =====================================================
// LEADFLOW SERVICE WORKER - PUSH NOTIFICATIONS
// =====================================================

const SW_VERSION = '1.0.0';

// Install Event
self.addEventListener('install', (event) => {
    console.log('[SW] Installing version:', SW_VERSION);
    self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
    console.log('[SW] Activated');
    event.waitUntil(self.clients.claim());
});

// ═══════════════════════════════════════════════════
// 🔔 PUSH EVENT - यही MAIN MAGIC है!
// जब Server से Push आता है, यह चलता है
// ═══════════════════════════════════════════════════
self.addEventListener('push', (event) => {
    console.log('[SW] 📩 Push Event Received!');
    
    // Default notification data
    let data = {
        title: '🔥 New Lead!',
        body: 'You have a new lead',
        icon: '/vite.svg',
        tag: 'lead-notification',
        url: '/'
    };
    
    // Parse push data if available
    if (event.data) {
        try {
            const payload = event.data.json();
            console.log('[SW] Payload:', payload);
            data = { ...data, ...payload };
        } catch (e) {
            console.log('[SW] Text payload:', event.data.text());
            data.body = event.data.text();
        }
    }
    
    // Notification options
    const options = {
        body: data.body,
        icon: data.icon || '/vite.svg',
        badge: '/vite.svg',
        tag: data.tag || 'lead-' + Date.now(),
        vibrate: [200, 100, 200, 100, 200],
        renotify: true,
        requireInteraction: true,
        data: {
            url: data.url || '/'
        }
    };
    
    // Show notification
    event.waitUntil(
        self.registration.showNotification(data.title, options)
            .then(() => console.log('[SW] ✅ Notification shown!'))
            .catch((err) => console.error('[SW] ❌ Notification error:', err))
    );
});

// ═══════════════════════════════════════════════════
// 🖱️ NOTIFICATION CLICK - जब User Click करे
// ═══════════════════════════════════════════════════
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] 🖱️ Notification clicked!');
    
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if app already open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        console.log('[SW] Focusing existing window');
                        return client.focus();
                    }
                }
                // Open new window
                console.log('[SW] Opening new window:', urlToOpen);
                return clients.openWindow(urlToOpen);
            })
    );
});

// Notification Close Event
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] 🔕 Notification dismissed');
});

// Message Event
self.addEventListener('message', (event) => {
    console.log('[SW] 💬 Message:', event.data);
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('[SW] 🎉 Service Worker Loaded - Version:', SW_VERSION);
