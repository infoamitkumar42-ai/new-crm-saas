// Keep service worker alive in background
export function keepServiceWorkerAlive() {
  if (!('serviceWorker' in navigator)) return;

  const keepAlive = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        const messageChannel = new MessageChannel();
        registration.active.postMessage('KEEP_ALIVE', [messageChannel.port2]);
        
        messageChannel.port1.onmessage = (event) => {
          console.log('SW alive:', event.data.alive);
        };
      }
    } catch (err) {
      console.error('Keep alive error:', err);
    }
  };

  // Ping every 25 seconds (before browser kills it at ~30s)
  setInterval(keepAlive, 25000);
  keepAlive(); // Initial ping
}
