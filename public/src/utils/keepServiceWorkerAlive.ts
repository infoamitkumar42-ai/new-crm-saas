// src/utils/keepServiceWorkerAlive.ts
// Keep service worker alive - prevents browser from killing it
export function keepServiceWorkerAlive() {
  if (!('serviceWorker' in navigator)) return;

  const keepAlive = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        const messageChannel = new MessageChannel();
        registration.active.postMessage('KEEP_ALIVE', [messageChannel.port2]);
        
        messageChannel.port1.onmessage = (event) => {
          if (import.meta.env.DEV) {
            console.log('[KeepAlive] SW alive:', event.data.alive);
          }
        };
      }
    } catch (err) {
      // Silent fail in production
      if (import.meta.env.DEV) {
        console.error('[KeepAlive] Error:', err);
      }
    }
  };

  // Ping every 25 seconds (before browser kills it at ~30s)
  setInterval(keepAlive, 25000);
  keepAlive(); // Initial ping
  
  console.log('[KeepAlive] Service Worker keep-alive started');
}
