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

// Helper function for timeout
const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error("SW_TIMEOUT")), ms));

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

  // 1. REFACTOR: initialize() - The "Silent Observer"
  useEffect(() => {
    const initialize = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

      try {
        // Step A: Wait for the SW to be ready (This prevents InvalidStateError)
        const registration = await navigator.serviceWorker.ready;
        swRegistrationRef.current = registration;

        // Step B: Check Subscription (Silent Polling)
        const checkSub = async () => {
          try {
            const sub = await registration.pushManager.getSubscription();
            if (sub) {
              console.log("✅ [LeadAlert] Subscription found. Syncing state.");
              setIsSubscribed(true);
              setIsLoading(false);
              // Silent sync to DB (Only if user is logged in)
              const { data: { user } } = await supabase.auth.getUser();
              if (user) subscribe(true);
            } else {
              console.log("ℹ️ [LeadAlert] No subscription yet. UI will show 'Enable Button'.");
              setIsSubscribed(false);
              setIsLoading(false);
            }
          } catch (e) {
            console.warn("CheckSub Error:", e);
          }
        };

        await checkSub();
        // Retry once after 2 seconds just in case (Silent)
        setTimeout(checkSub, 2000);

        // Listen for Controller Change (But DO NOT RELOAD)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log("🔄 New SW took control. Updating state...");
          checkSub();
        });

      } catch (error) {
        console.warn("SW Init Warning (Non-Fatal):", error);
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    initialize();
  }, [VAPID_KEY]);

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

    try {
      if (!VAPID_KEY) throw new Error('VAPID Key missing');

      // 1. Ensure Service Worker is ready
      if (!navigator.serviceWorker.controller) {
        console.info("ℹ️ No active Service Worker found. Registering...");
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }

      const reg = await navigator.serviceWorker.ready;
      swRegistrationRef.current = reg;

      // 2. Request Permission
      const permissionResult = await window.Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // 3. Subscribe
      let subscription;
      try {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY) as any
        });
      } catch (subErr: any) {
        // Auto-fix for InvalidStateError or Key Mismatch
        if (subErr.name === 'InvalidStateError' || subErr.message?.includes('applicationServerKey')) {
          console.warn("State/Key error. Resetting subscription...");
          const existing = await reg.pushManager.getSubscription();
          if (existing) await existing.unsubscribe();
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_KEY) as any
          });
        } else {
          throw subErr;
        }
      }

      // 4. Save to DB
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');

      const subJson = subscription.toJSON();
      const { error: rpcError } = await supabase.rpc('upsert_push_subscription', {
        p_endpoint: subJson.endpoint,
        p_p256dh: subJson.keys?.p256dh,
        p_auth: subJson.keys?.auth,
        p_user_agent: navigator.userAgent
      });

      if (rpcError) throw rpcError;

      setIsSubscribed(true);
      console.log("✅ [LeadAlert] Subscription synchronized.");
      return true;

    } catch (err: any) {
      // 🛑 HANDLE 403/Login issues quietly if silent sync
      const isLoginError = err.message?.includes('User not logged in') || err.status === 403;

      if (isLoginError) {
        if (!isSilent) console.warn("Push sync skipped: User not logged in.");
        return false;
      }

      console.warn("Subscribe Info:", err.message);

      // Only reload for critical key mismatch after 1s delay (manual action)
      if (err.message?.includes('different applicationServerKey')) {
        console.error("Critical VAPID Mismatch. Resetting in 1s...");
        setTimeout(() => window.location.reload(), 1000);
      } else if (!isSilent) {
        setError(err.message);
        alert("Notification Error: " + err.message);
      }
      return false;
    } finally {
      setIsLoading(false);
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
