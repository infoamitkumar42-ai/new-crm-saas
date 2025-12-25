import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

// Helper to convert key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotification() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // ⚠️ HARDCODED KEY (Taaki .env ka issue na ho testing mein)
  const VAPID_KEY = "BOi4O_qTZndnapSjTjiI8k3KfrT6rCkCkj0a4uoA6tVr2-mbEEypXnLcSlUmMuvzjrXY2Ixv2iIUWBwawFN7TXU";

  useEffect(() => {
    // Check initial status
    const init = async () => {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.register('/sw.js');
        swRegistrationRef.current = reg;
        const sub = await reg.pushManager.getSubscription();
        if (sub) setIsSubscribed(true);
      }
    };
    init();
  }, []);

  const subscribe = async () => {
    try {
      // 1. Permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert("❌ Permission Denied! Browser settings mein allow karo.");
        return;
      }

      // 2. Browser Subscription
      if (!swRegistrationRef.current) {
        alert("❌ Service Worker not ready. Reload page.");
        return;
      }

      // alert("🔄 Subscribing to Browser...");
      const subscription = await swRegistrationRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
      });

      // 3. Save to Supabase
      // alert("💾 Saving to Database...");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert("❌ Error: You are not logged in!");
        return;
      }

      const subJson = subscription.toJSON();

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
          user_agent: navigator.userAgent
        }, { onConflict: 'endpoint' });

      if (error) {
        alert("❌ DB Error: " + error.message);
        console.error(error);
      } else {
        alert("✅ Success! Notification Connected. Ab Table Check Karo.");
        setIsSubscribed(true);
      }

    } catch (err: any) {
      alert("❌ Critical Error: " + err.message);
      console.error(err);
    }
  };

  return { subscribe, isSubscribed, testNotification: () => {} };
}
