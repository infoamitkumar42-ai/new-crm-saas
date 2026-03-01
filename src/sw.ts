/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

// ╔════════════════════════════════════════════════════════════╗
// ║  🚀 LeadFlow CRM Service Worker v5.0 (MINIMAL)            ║
// ║  ZERO caching. ZERO fetch interception.                    ║
// ║  Only: Push Notifications + Notification Click             ║
// ║                                                            ║
// ║  WHY: Workbox precacheAndRoute was silently swallowing      ║
// ║  ALL auth/API requests to api.leadflowcrm.in, causing      ║
// ║  15s timeouts and profile fetch failures on page refresh.   ║
// ║  No amount of bypass logic survives Workbox's internal      ║
// ║  fetch handler registration.                                ║
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

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return (client as any).focus();
                }
            }
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
