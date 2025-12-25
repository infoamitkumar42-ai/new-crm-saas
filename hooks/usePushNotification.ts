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
}

export function usePushNotification(): UsePushNotificationReturn {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  // Debug logger
  const log = (message: string, data?: any) => {
    console.log(`[PushNotification] ${message}`, data || '');
  };

  // Initialize service worker and check existing subscription
  useEffect(() => {
    const init = async () => {
      try {
        log('Initializing...');
        
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
        log('Service Worker registered', registration);
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        log('Service Worker is ready');
        
        swRegistrationRef.current = registration;

        // Check existing subscription
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          log('Existing subscription found', existingSubscription.endpoint);
          setIsSubscribed(true);
        } else {
          log('No existing subscription');
        }
      } catch (err) {
        log('Init error', err);
        console.error(err);
      }
    };

    init();
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      log('Starting subscription process...');

      // Step 1: Check VAPID key
      if (!VAPID_KEY) {
        throw new Error('VAPID public key is not configured. Check VITE_VAPID_PUBLIC_KEY in .env');
      }
      log('VAPID key found', VAPID_KEY.substring(0, 20) + '...');

      // Step 2: Request notification permission
      log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      log('Permission result:', permission);

      if (permission !== 'granted') {
        throw new Error(`Notification permission ${permission}. Please allow notifications in browser settings.`);
      }

      // Step 3: Check service worker
      if (!swRegistrationRef.current) {
        log('SW not ready, waiting...');
        await navigator.serviceWorker.ready;
        swRegistrationRef.current = await navigator.serviceWorker.getRegistration();
      }

      if (!swRegistrationRef.current) {
        throw new Error('Service Worker registration failed. Try refreshing the page.');
      }
      log('Service Worker ready');

      // Step 4: Create push subscription
      log('Creating push subscription...');
      
      // Unsubscribe from any existing subscription first
      const existingSub = await swRegistrationRef.current.pushManager.getSubscription();
      if (existingSub) {
        log('Removing existing browser subscription...');
        await existingSub.unsubscribe();
      }

      const subscription = await swRegistrationRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
      });
      
      const subJson = subscription.toJSON();
      log('Push subscription created:', {
        endpoint: subJson.endpoint?.substring(0, 50) + '...',
        hasP256dh: !!subJson.keys?.p256dh,
        hasAuth: !!subJson.keys?.auth
      });

      // Validate subscription data
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error('Invalid subscription data from browser. Missing endpoint or keys.');
      }

      // Step 5: Check authentication
      log('Checking authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        log('Auth error', authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }
      
      if (!user) {
        throw new Error('You must be logged in to enable notifications. Please log in first.');
      }
      log('User authenticated:', user.id);

      // Step 6: Save to database using RPC function
      log('Saving subscription to database...');
      
      const { data: rpcResult, error: rpcError } = await supabase.rpc('upsert_push_subscription', {
        p_endpoint: subJson.endpoint,
        p_p256dh: subJson.keys.p256dh,
        p_auth: subJson.keys.auth,
        p_user_agent: navigator.userAgent
      });

      log('RPC result:', rpcResult);

      if (rpcError) {
        log('RPC error:', rpcError);
        throw new Error(`Database error: ${rpcError.message}`);
      }

      // Check if the function returned success
      if (rpcResult && typeof rpcResult === 'object') {
        if (!rpcResult.success) {
          throw new Error(rpcResult.error || 'Unknown database error');
        }
      }

      // Step 7: Verify the subscription was saved
      log('Verifying subscription in database...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint')
        .eq('user_id', user.id)
        .single();

      if (verifyError) {
        log('Verification warning:', verifyError);
        // Don't throw - the insert might have succeeded
      } else {
        log('Subscription verified in database:', verifyData);
      }

      setIsSubscribed(true);
      log('✅ Subscription complete!');
      
      return true;

    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred';
      log('❌ Subscribe error:', errorMessage);
      console.error('Full error:', err);
      setError(errorMessage);
      
      // Show user-friendly alert
      alert(`❌ Notification Setup Failed:\n\n${errorMessage}`);
      
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
      log('Starting unsubscribe process...');

      // Get current subscription
      if (swRegistrationRef.current) {
        const subscription = await swRegistrationRef.current.pushManager.getSubscription();
        
        if (subscription) {
          // Remove from database first
          const { error: rpcError } = await supabase.rpc('remove_push_subscription', {
            p_endpoint: subscription.endpoint
          });

          if (rpcError) {
            log('RPC unsubscribe error:', rpcError);
          }

          // Unsubscribe from browser
          await subscription.unsubscribe();
          log('Unsubscribed from browser');
        }
      }

      setIsSubscribed(false);
      log('✅ Unsubscribe complete');
      return true;

    } catch (err: any) {
      log('❌ Unsubscribe error:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Test notification (client-side only)
  const testNotification = useCallback(async () => {
    try {
      log('Sending test notification...');
      
      if (!swRegistrationRef.current) {
        alert('Service Worker not ready');
        return;
      }

      await swRegistrationRef.current.showNotification('🧪 Test Notification', {
        body: 'Push notifications are working correctly!',
        icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        vibrate: [200, 100, 200],
        tag: 'test-notification'
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
    testNotification
  };
}
