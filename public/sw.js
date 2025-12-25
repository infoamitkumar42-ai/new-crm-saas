// public/sw.js
// LeadFlow CRM - Service Worker
// Updated for better reliability and performance

const CACHE_NAME = 'leadflow-v2';
const NOTIFICATION_TAG_PREFIX = 'lead-';

// Install - Skip waiting for immediate activation
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v2...');
  self.skipWaiting();
});

// Activate - Clean old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v2...');
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      }),
      // Claim all clients
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activated and claimed clients');
    })
  );
});

// Push Event - Handle incoming notifications
self.addEventListener('push', (event) => {
  const timestamp = new Date().toLocaleTimeString('en-IN', { 
    hour12: true, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  
  console.log('[SW] 📥 Push received at', timestamp);
  
  // Default notification data
  let data = { 
    title: '🔥 Naya Lead Aaya!', 
    body: 'Check your dashboard for details' 
  };
  
  // Parse incoming data
  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
      console.log('[SW] 📦 Parsed data:', data);
    } catch (e) {
      console.log('[SW] ⚠️ Parse error, using default notification');
    }
  }

  // Notification options
  const options = {
    body: data.body || 'You have received a new lead',
    icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    badge: data.badge || 'https://cdn-icons-png.flaticon.com/512/891/891462.png',
    vibrate: data.vibrate || [300, 100, 300, 100, 300],
    tag: data.tag || `${NOTIFICATION_TAG_PREFIX}${Date.now()}`,
    renotify: true,
    requireInteraction: true, // Notification stays until user dismisses
    silent: false,
    timestamp: Date.now(),
    data: {
      url: data.data?.url || '/leads',
      timestamp: Date.now(),
      ...(data.data || {})
    },
    actions: [
      { action: 'open', title: '📂 Open Dashboard', icon: '/icon-open.png' },
      { action: 'dismiss', title: '✖️ Dismiss', icon: '/icon-close.png' }
    ]
  };

  // Show notification
  event.waitUntil(
    self.registration.showNotification(
      data.title || '🔥 New Lead!', 
      options
    )
    .then(() => {
      console.log('[SW] ✅ Notification shown successfully');
    })
    .catch(err => {
      console.error('[SW] ❌ Show notification error:', err);
    })
  );
});

// Notification Click - Handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 👆 Notification clicked, action:', event.action);
  
  // Close notification
  event.notification.close();

  // If user clicked dismiss, do nothing
  if (event.action === 'dismiss') {
    console.log('[SW] Notification dismissed by user');
    return;
  }

  // Get URL to open
  const urlToOpen = event.notification.data?.url || '/leads';
  const fullUrl = new URL(urlToOpen, self.location.origin).href;

  console.log('[SW] Opening URL:', fullUrl);

  // Handle click - focus existing window or open new
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    })
    .then((clientList) => {
      console.log('[SW] Found', clientList.length, 'open windows');
      
      // Try to focus existing window
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(fullUrl);
        
        // Check if same origin
        if (clientUrl.origin === targetUrl.origin && 'focus' in client) {
          console.log('[SW] Focusing existing window');
          return client.focus().then(focusedClient => {
            // Navigate to the target URL
            if ('navigate' in focusedClient) {
              return focusedClient.navigate(fullUrl);
            }
            return focusedClient;
          });
        }
      }
      
      // No existing window found - open new
      if (clients.openWindow) {
        console.log('[SW] Opening new window');
        return clients.openWindow(fullUrl);
      }
    })
    .catch(err => {
      console.error('[SW] Error handling click:', err);
    })
  );
});

// Keep Alive - Prevent service worker from sleeping
self.addEventListener('message', (event) => {
  if (event.data === 'KEEP_ALIVE') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ 
        alive: true, 
        timestamp: Date.now(),
        version: 'v2'
      });
    }
    
    // Minimal logging to prevent console spam
    if (Math.random() < 0.1) { // Log only 10% of pings
      console.log('[SW] 💓 Keep-alive ping received');
    }
  }
});

// Fetch - Optional: Add caching strategy if needed
self.addEventListener('fetch', (event) => {
  // Network-first strategy for API calls
  if (event.request.url.includes('/api/') || event.request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
  }
  // For other requests, use network
  // Add caching strategies as needed
});

// Background Sync - For offline support (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-leads') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(
      // Add your sync logic here
      Promise.resolve()
    );
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled rejection:', event.reason);
});

console.log('[SW] Service Worker v2 loaded and ready');
