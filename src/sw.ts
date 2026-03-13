/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

// ╔════════════════════════════════════════════════════════════╗
// ║  🚀 LeadFlow CRM Service Worker v5.1 (NOTIFICATION FIX)   ║
// ║  ZERO caching. ZERO fetch interception.                    ║
// ║  Only: Push Notifications + Notification Click             ║
// ║                                                            ║
// ║  v5.1 Changes:                                             ║
// ║  - ✅ Fixed URL routing from edge function payload          ║
// ║  - ✅ requireInteraction: notification stays on screen      ║
// ║  - ✅ renotify: no missed duplicate notifications           ║
// ║  - ✅ Full URL construction for notificationclick           ║
// ╚════════════════════════════════════════════════════════════╝

// 1. Install & Activate — take control immediately
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Claim all clients AND purge ALL old caches
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // 🧹 NUKE all Workbox/SW caches from previous versions
            caches.keys().then(names =>
                Promise.all(names.map(name => {
                    console.log(`🧹 [SW] Purging old cache: ${name}`);
                    return caches.delete(name);
                }))
            )
        ])
    );
});

// 2. 🚀 PUSH NOTIFICATIONS
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
            vibrate: [300, 100, 300, 100, 300],
            tag: payload.tag || 'lead-' + Date.now(),
            renotify: true,
            requireInteraction: true,
            silent: false,
            data: {
                url: payload.data?.url || payload.url || '/'
            },
            actions: [
                { action: 'open', title: 'View Lead' }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } catch (err) {
        console.error('❌ [SW] Push Payload Error:', err);
        event.waitUntil(
            self.registration.showNotification('🔥 LeadFlow Alert', {
                body: 'You have a new activity on your dashboard.',
                icon: '/icon-192x192.png'
            })
        );
    }
});

// 3. 🖱️ NOTIFICATION CLICK HANDLER
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetPath = event.notification.data?.url || '/';
    const baseUrl = self.location.origin;
    const urlToOpen = targetPath.startsWith('http') ? targetPath : baseUrl + targetPath;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if app is already open
            for (const client of windowClients) {
                if (client.url.includes(baseUrl) && 'focus' in client) {
                    // App open hai — navigate + focus
                    (client as any).navigate(urlToOpen);
                    return (client as any).focus();
                }
            }
            // App band hai — naya window kholo
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});

// 4. 🛠️ MESSAGE HANDLER
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
