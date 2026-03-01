/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

// 🚀 BYPASS SERVICE WORKER FOR API/AUTH
// (Prevents SW from blocking or incorrectly caching Cloudflare Proxy/Supabase requests)
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.hostname === 'api.leadflowcrm.in' || url.hostname.includes('supabase.co')) {
        return; // Allow browser to handle directly
    }
});

// 1. Precache assets (Automated by VitePWA)
precacheAndRoute(self.__WB_MANIFEST || []);

// 🚀 STRICT NETWORK BYPASS FOR SUPABASE API & WEBSOCKETS
registerRoute(
    ({ url, request }) =>
        url.pathname.startsWith('/supabase/') ||
        url.hostname.includes('supabase.co') ||
        request.url.startsWith('wss://'),
    new NetworkOnly()
);

// 2. Install & Activate
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// 3. 🚀 BACKGROUND PUSH LISTENER
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
                if (client.url === urlToOpen && 'focus' in client) {
                    return (client as any).focus();
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
