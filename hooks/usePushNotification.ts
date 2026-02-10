// src/hooks/usePushNotification.ts
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
  // 1. Detect iOS immediately (Hard Stop)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOS) {
    return {
      isSubscribed: false,
      isLoading: false,
      isSupported: false,
      permission: 'denied',
      error: null,
      subscribe: async () => { alert("Please use 'Add to Home Screen' for notifications on iOS."); return false; },
      unsubscribe: async () => false,
      testNotification: async () => { },
      refreshSubscription: async () => { }
    };
  }

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [error, setError] = useState<string | null>(null);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  // Debug logger (reduced logging for performance)
  const log = (message: string, data?: any) => {
    if ((import.meta.env as any).DEV) {
      console.log(`[Push] ${message}`, data || '');
    }
  };

  // Initialize service worker and check existing subscription
  useEffect(() => {
    const init = async () => {
      try {
        if (!('serviceWorker' in navigator)) {
          log('Service Worker not supported');
          return;
        }

        if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
          log('Push notifications not supported');
          setIsSupported(false);
          return;
        }

        setIsSupported(true);
        setPermission(window.Notification.permission);

        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        log('SW ready');

        swRegistrationRef.current = registration;

        // Check existing subscription
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          log('Existing subscription found');
          setIsSubscribed(true);
        }
      } catch (err) {
        log('Init error', err);
      }
    };

    init();
  }, []);

  // Auto-Sync: If permission granted, update UI and sync DB
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
      setIsSubscribed(true);
      // Silent sync
      subscribe(true);
    }
  }, []);

  // Keep service worker alive (prevent sleep)
  useEffect(() => {
    const keepAlive = async () => {
      try {
        if (swRegistrationRef.current?.active) {
          const messageChannel = new MessageChannel();
          swRegistrationRef.current.active.postMessage('KEEP_ALIVE', [messageChannel.port2]);
        }
      } catch (err) {
        // Silent fail - don't spam console
      }
    };

    // Ping every 25 seconds
    const interval = setInterval(keepAlive, 25000);
    keepAlive(); // Initial ping

    return () => clearInterval(interval);
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (isSilent = false): Promise<boolean> => {
    if (!isSilent) setIsLoading(true);
    if (!isSilent) setError(null);

    // Timeout Promise (5 Seconds)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: Subscription took too long')), 5000)
    );

    try {
      // Step 0: Check VAPID key
      if (!VAPID_KEY) {
        throw new Error('System Error: VAPID Key missing');
      }

      // Step 1: Check service worker support
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker not supported');
      }

      // Step 2: Race against logic
      await Promise.race([
        (async () => {
          // Request notification permission
          if (typeof window === 'undefined' || !('Notification' in window)) {
            throw new Error('Notifications not supported');
          }

          const permissionResult = await window.Notification.requestPermission();
          setPermission(permissionResult);
          if (permissionResult !== 'granted') {
            throw new Error('Notification permission denied');
          }

          // Service worker ready
          const reg = await navigator.serviceWorker.ready;
          swRegistrationRef.current = reg;

          // Subscribe (with Auto-Fix for Key Mismatch)
          let subscription;
          const subscribeOptions = {
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_KEY) as any
          };

          try {
            subscription = await reg.pushManager.subscribe(subscribeOptions);
          } catch (subErr: any) {
            // 🔥 AUTO-FIX: If key mismatch, unsubscribe and retry
            if (subErr.message?.includes('applicationServerKey') || subErr.name === 'InvalidStateError') {
              log('⚠️ VAPID Key Mismatch detected. Unsubscribing old keys and retrying...');
              const existingSub = await reg.pushManager.getSubscription();
              if (existingSub) {
                await existingSub.unsubscribe();
              }
              // Retry with new key
              subscription = await reg.pushManager.subscribe(subscribeOptions);
            } else {
              throw subErr;
            }
          }

          const subJson = subscription.toJSON();
          if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
            throw new Error('Invalid subscription data received');
          }

          // Save to DB
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not logged in');

          const { error: rpcError } = await supabase.rpc('upsert_push_subscription', {
            p_endpoint: subJson.endpoint,
            p_p256dh: subJson.keys.p256dh,
            p_auth: subJson.keys.auth,
            p_user_agent: navigator.userAgent
          });

          if (rpcError) throw new Error(`Database error: ${rpcError.message}`);

          setIsSubscribed(true);
          return true;
        })(),
        timeoutPromise
      ]);

      return true;

    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error';
      log('❌ Subscribe error:', errorMessage);

      // SILENT RECOVERY: Check for the specific mismatch error
      if (errorMessage.includes('different applicationServerKey') || errorMessage.includes('gcm_sender_id')) {
        console.warn("VAPID Key Mismatch detected. Silently fixing...");

        // 1. Get the zombie subscription
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();

          // 2. Kill it
          if (sub) {
            await sub.unsubscribe();
            console.log("Old subscription removed.");
          }
        } catch (unsubErr) {
          console.error("Failed to unsubscribe old SW:", unsubErr);
        }

        // 3. Force Reload to clear state (User will click button again and it will work)
        window.location.reload();
        return false; // <--- CRITICAL: Return here so NO alert is shown
      }

      if (!isSilent) {
        setError(errorMessage);
        // Only show alert for OTHER real errors
        alert("Notification Error: " + errorMessage);
        console.error("Subscription Error:", errorMessage);
      }

      return false;
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [VAPID_KEY]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      if (swRegistrationRef.current) {
        const subscription = await swRegistrationRef.current.pushManager.getSubscription();

        if (subscription) {
          // Remove from database first
          await supabase.rpc('remove_push_subscription', {
            p_endpoint: subscription.endpoint
          });

          // Unsubscribe from browser
          await subscription.unsubscribe();
        }
      }

      setIsSubscribed(false);
      log('✅ Unsubscribed');
      return true;

    } catch (err: any) {
      log('❌ Unsubscribe error:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh subscription if stale (auto-renew)
  const refreshSubscription = useCallback(async () => {
    try {
      if (!swRegistrationRef.current) return;

      const existingSub = await swRegistrationRef.current.pushManager.getSubscription();

      if (existingSub) {
        // Check if subscription is stale (> 7 days old)
        const { data: dbSub } = await supabase
          .from('push_subscriptions')
          .select('created_at')
          .eq('endpoint', existingSub.endpoint)
          .single();

        if (dbSub) {
          const age = Date.now() - new Date(dbSub.created_at).getTime();
          const sevenDays = 7 * 24 * 60 * 60 * 1000;

          if (age > sevenDays) {
            log('Subscription stale, refreshing...');
            await existingSub.unsubscribe();
            await subscribe(); // Re-subscribe
          }
        }
      }
    } catch (err) {
      log('Refresh error', err);
    }
  }, [subscribe]);

  // Auto-refresh on mount and daily
  useEffect(() => {
    // Initial refresh check
    refreshSubscription();

    // Daily refresh
    const interval = setInterval(refreshSubscription, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshSubscription]);

  // Test notification (client-side only)
  const testNotification = useCallback(async () => {
    try {
      if (!swRegistrationRef.current) {
        alert('Service Worker not ready');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const options: any = {
        body: 'Push notifications are working correctly!',
        icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        vibrate: [300, 100, 300],
        tag: 'test-notification',
        requireInteraction: true
      };

      await swRegistrationRef.current.showNotification('🧪 Test Notification', options);

      log('Test notification sent');
    } catch (err) {
      log('Test notification error:', err);
      alert('Failed to show test notification');
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
