// hooks/usePushNotification.ts
// ╔════════════════════════════════════════════════════════════╗
// ║  Push Notification Hook v7 - SW Ready Fix                  ║
// ║  Fix: navigator.serviceWorker.ready stuck issue            ║
// ║  Uses getRegistrations() fallback                          ║
// ╚════════════════════════════════════════════════════════════╝

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// 🔧 FIX: Get SW registration with fallback (main fix)
async function getSwRegistration(): Promise<ServiceWorkerRegistration> {
  // Method 1: Try navigator.serviceWorker.ready with 3s timeout
  try {
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('SW_READY_TIMEOUT')), 3000)
      )
    ]);
    console.log('[Push] ✅ SW ready resolved');
    return reg;
  } catch {
    console.log('[Push] ⚠️ SW ready timeout, using fallback...');
  }

  // Method 2: Fallback - getRegistrations()
  const registrations = await navigator.serviceWorker.getRegistrations();
  const activeReg = registrations.find(r => r.active);

  if (activeReg) {
    console.log('[Push] ✅ Found active SW via getRegistrations()');
    return activeReg;
  }

  // Method 3: Re-register SW
  console.log('[Push] ⚠️ No active SW, re-registering...');
  const newReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

  // Wait for activation
  if (newReg.installing || newReg.waiting) {
    await new Promise<void>((resolve) => {
      const sw = newReg.installing || newReg.waiting;
      if (!sw) { resolve(); return; }
      sw.addEventListener('statechange', () => {
        if (sw.state === 'activated') resolve();
      });
      // Safety timeout
      setTimeout(resolve, 5000);
    });
  }

  if (newReg.active) {
    console.log('[Push] ✅ SW re-registered and active');
    return newReg;
  }

  throw new Error('Could not get active Service Worker');
}

interface UsePushNotificationReturn {
  isSubscribed: boolean;
  isLoading: boolean;
  isSupported: boolean;
  permission: NotificationPermission;
  error: string | null;
  subscribe: (isSilent?: boolean) => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  testNotification: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

export function usePushNotification(): UsePushNotificationReturn {
  // iOS detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isStandalone = (window.matchMedia?.('(display-mode: standalone)').matches) ||
    (navigator as any).standalone === true;

  if (isIOS && !isStandalone) {
    return {
      isSubscribed: false,
      isLoading: false,
      isSupported: false,
      permission: 'denied',
      error: null,
      subscribe: async () => {
        alert("📱 iPhone pe notifications ke liye 'Add to Home Screen' karein!\n\nSafari → Share button → 'Add to Home Screen'");
        return false;
      },
      unsubscribe: async () => false,
      testNotification: async () => {},
      refreshSubscription: async () => {}
    };
  }

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [error, setError] = useState<string | null>(null);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const isSyncingRef = useRef(false);

  const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  // ---------------------------------------------------------------
  // INITIALIZE - Check existing subscription
  // ---------------------------------------------------------------
  useEffect(() => {
    const initialize = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        console.log('[Push] ❌ Not supported');
        setIsSupported(false);
        setIsLoading(false);
        return;
      }

      setIsSupported(true);
      setPermission(Notification.permission);

      try {
        // 🔧 FIX: Use our custom function instead of navigator.serviceWorker.ready
        const registration = await getSwRegistration();
        swRegistrationRef.current = registration;

        // Check existing subscription
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          console.log('[Push] ✅ Existing subscription found');
          setIsSubscribed(true);

          // Silent sync to DB
          syncSubscriptionToDb(sub).catch(() => {});
        } else {
          console.log('[Push] ℹ️ No subscription yet');
          setIsSubscribed(false);

          // Auto-subscribe if permission already granted (guard prevents double subscribe)
          if (Notification.permission === 'granted' && !isSyncingRef.current) {
            console.log('[Push] 🔄 Permission granted, auto-subscribing...');
            subscribe(true);
          }
        }
      } catch (err: any) {
        console.warn('[Push] Init warning:', err.message);
      }

      setIsLoading(false);
    };

    setIsLoading(true);
    initialize();
  }, [VAPID_KEY]);

  // ---------------------------------------------------------------
  // SYNC SUBSCRIPTION TO DB
  // ---------------------------------------------------------------
  const syncSubscriptionToDb = async (sub: PushSubscription) => {
    // 🔧 FIX: getUser() gives 403 when token expired, use getSession instead
    let userId: string | null = null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id || null;
    } catch {
      // Fallback: try getUser
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
      } catch { /* ignore */ }
    }

    if (!userId) {
      console.warn('[Push] No user session, skipping DB sync');
      return;
    }

    try {
      const subJson = sub.toJSON();
      const { error: rpcError } = await supabase.rpc('upsert_push_subscription', {
        p_endpoint: subJson.endpoint,
        p_p256dh: subJson.keys?.p256dh,
        p_auth: subJson.keys?.auth,
        p_user_agent: navigator.userAgent.substring(0, 200)
      });

      if (rpcError) {
        console.warn('[Push] DB sync error:', rpcError.message);
      } else {
        console.log('[Push] ✅ Subscription synced to DB');
      }
    } catch (e: any) {
      console.warn('[Push] DB sync failed:', e.message);
    }
  };

  // ---------------------------------------------------------------
  // KEEP ALIVE - Prevent SW from sleeping
  // ---------------------------------------------------------------
  useEffect(() => {
    const keepAlive = () => {
      try {
        if (swRegistrationRef.current?.active) {
          const mc = new MessageChannel();
          swRegistrationRef.current.active.postMessage('KEEP_ALIVE', [mc.port2]);
        }
      } catch { /* ignore */ }
    };

    const interval = setInterval(keepAlive, 25000);
    keepAlive();

    return () => clearInterval(interval);
  }, []);

  // ---------------------------------------------------------------
  // SUBSCRIBE
  // ---------------------------------------------------------------
  const subscribe = useCallback(async (isSilent = false): Promise<boolean> => {
    if (isSyncingRef.current) return false;
    isSyncingRef.current = true;

    if (!isSilent) setIsLoading(true);
    if (!isSilent) setError(null);

    try {
      if (!VAPID_KEY) throw new Error('VAPID Key missing');

      // 🔧 FIX: Use our custom function
      const reg = await getSwRegistration();
      swRegistrationRef.current = reg;

      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Subscribe to push
      let subscription: PushSubscription;
      try {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
        });
        console.log('[Push] ✅ Subscribed!');
        console.log('[Push] Endpoint:', subscription.endpoint.substring(0, 80));
      } catch (subErr: any) {
        if (subErr.name === 'InvalidStateError' || subErr.message?.includes('applicationServerKey')) {
          console.warn('[Push] Key mismatch, resetting...');
          const existing = await reg.pushManager.getSubscription();
          if (existing) await existing.unsubscribe();
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
          });
        } else {
          throw subErr;
        }
      }

      // Save to DB
      let userId: string | null = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id || null;
      } catch { /* ignore */ }

      if (!userId) {
        console.warn('[Push] No user session for subscribe');
        return false;
      }

      await syncSubscriptionToDb(subscription);

      setIsSubscribed(true);
      console.log('[Push] ✅ Fully subscribed and synced!');

      // Send a confirmation test notification
      if (!isSilent) {
        reg.showNotification('🔔 Notifications Enabled!', {
          body: 'You will now receive lead alerts.',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          vibrate: [200, 100, 200],
          tag: 'enabled-' + Date.now(),
          requireInteraction: false
        });
      }

      return true;

    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        return false;
      }

      const isLoginError = err.message?.includes('User not logged in') || err.status === 403;
      if (isLoginError && isSilent) return false;

      if (err.message?.includes('different applicationServerKey')) {
        console.error('[Push] VAPID mismatch. Clearing...');
        try {
          const reg = await getSwRegistration();
          const existing = await reg.pushManager.getSubscription();
          if (existing) await existing.unsubscribe();
        } catch { /* ignore */ }
        if (!isSilent) {
          setError('Key mismatch fixed. Please try again.');
        }
      } else if (!isSilent) {
        console.error('[Push] Subscribe error:', err.message);
        setError(err.message);
      }
      return false;
    } finally {
      if (!isSilent) setIsLoading(false);
      isSyncingRef.current = false;
    }
  }, [VAPID_KEY]);

  // ---------------------------------------------------------------
  // UNSUBSCRIBE
  // ---------------------------------------------------------------
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const reg = await getSwRegistration();
      const subscription = await reg.pushManager.getSubscription();

      if (subscription) {
        await supabase.rpc('remove_push_subscription', {
          p_endpoint: subscription.endpoint
        });
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      console.log('[Push] ✅ Unsubscribed');
      return true;

    } catch (err: any) {
      console.error('[Push] Unsubscribe error:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------
  // REFRESH SUBSCRIPTION (Auto-renew stale subs)
  // ---------------------------------------------------------------
  const refreshSubscription = useCallback(async () => {
    try {
      const reg = await getSwRegistration();
      const existingSub = await reg.pushManager.getSubscription();

      if (existingSub) {
        const { data: dbSub } = await supabase
          .from('push_subscriptions')
          .select('created_at')
          .eq('endpoint', existingSub.endpoint)
          .single();

        if (dbSub) {
          const age = Date.now() - new Date(dbSub.created_at).getTime();
          const sevenDays = 7 * 24 * 60 * 60 * 1000;

          if (age > sevenDays) {
            console.log('[Push] Subscription stale, refreshing...');
            await existingSub.unsubscribe();
            await subscribe();
          }
        } else {
          // Subscription exists in browser but not in DB - sync it
          console.log('[Push] Subscription not in DB, syncing...');
          await syncSubscriptionToDb(existingSub);
        }
      }
    } catch (err) {
      console.warn('[Push] Refresh error:', err);
    }
  }, [subscribe]);

  // Auto-refresh on mount and daily
  // Delay initial call by 5s to avoid auth lock contention during app startup
  useEffect(() => {
    const initialDelay = setTimeout(refreshSubscription, 5000);
    const interval = setInterval(refreshSubscription, 24 * 60 * 60 * 1000);
    return () => { clearTimeout(initialDelay); clearInterval(interval); };
  }, [refreshSubscription]);

  // ---------------------------------------------------------------
  // TEST NOTIFICATION
  // ---------------------------------------------------------------
  const testNotification = useCallback(async () => {
    try {
      const reg = await getSwRegistration();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const options: any = {
        body: 'Push notifications are working correctly! 🎉',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [300, 100, 300, 100, 300],
        tag: 'test-' + Date.now(),
        requireInteraction: true,
        silent: false,
        renotify: true,
        actions: [
          { action: 'open', title: '📂 Open App' },
          { action: 'dismiss', title: '✖ Dismiss' }
        ]
      };

      await reg.showNotification('🧪 Test Notification', options);
      console.log('[Push] ✅ Test notification sent');
    } catch (err) {
      console.error('[Push] Test error:', err);
      alert('Failed to show test notification: ' + (err as Error).message);
    }
  }, []);

  return {
    isSubscribed,
    isLoading,
    isSupported,
    permission,
    error,
    subscribe,
    unsubscribe,
    testNotification,
    refreshSubscription
  };
}
