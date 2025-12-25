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
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  testNotification: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

export function usePushNotification(): UsePushNotificationReturn {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  // Debug logger (reduced logging for performance)
  const log = (message: string, data?: any) => {
    if (import.meta.env.DEV) {
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

        if (!('PushManager' in window)) {
          log('Push notifications not supported');
          return;
        }

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
  const subscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Check VAPID key
      if (!VAPID_KEY) {
        throw new Error('VAPID key not configured');
      }

      // Step 2: Request notification permission
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Step 3: Check service worker
      if (!swRegistrationRef.current) {
        await navigator.serviceWorker.ready;
        swRegistrationRef.current = await navigator.serviceWorker.getRegistration();
      }

      if (!swRegistrationRef.current) {
        throw new Error('Service Worker not ready');
      }

      // Step 4: Create push subscription
      // Unsubscribe from any existing subscription first
      const existingSub = await swRegistrationRef.current.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }

      const subscription = await swRegistrationRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
      });
      
      const subJson = subscription.toJSON();

      // Validate subscription data
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error('Invalid subscription data');
      }

      // Step 5: Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not logged in');
      }

      // Step 6: Save to database using RPC function
      const { data: rpcResult, error: rpcError } = await supabase.rpc('upsert_push_subscription', {
        p_endpoint: subJson.endpoint,
        p_p256dh: subJson.keys.p256dh,
        p_auth: subJson.keys.auth,
        p_user_agent: navigator.userAgent
      });

      if (rpcError) {
        throw new Error(`Database error: ${rpcError.message}`);
      }

      // Check if the function returned success
      if (rpcResult && typeof rpcResult === 'object' && !rpcResult.success) {
        throw new Error(rpcResult.error || 'Database save failed');
      }

      setIsSubscribed(true);
      log('✅ Subscribed successfully');
      
      return true;

    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error';
      log('❌ Subscribe error:', errorMessage);
      setError(errorMessage);
      
      alert(`❌ Notification setup failed:\n\n${errorMessage}`);
      
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

      await swRegistrationRef.current.showNotification('🧪 Test Notification', {
        body: 'Push notifications are working correctly!',
        icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        vibrate: [300, 100, 300],
        tag: 'test-notification',
        requireInteraction: true
      });

      log('Test notification sent');
    } catch (err) {
      log('Test notification error:', err);
      alert('Failed to show test notification');
    }
  }, []);

  return {
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    testNotification,
    refreshSubscription
  };
}
