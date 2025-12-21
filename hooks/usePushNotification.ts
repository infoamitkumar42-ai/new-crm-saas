import { useState } from 'react';
import { supabase } from '../supabaseClient';

// 👇 AAPKI PUBLIC KEY
const VAPID_PUBLIC_KEY = "BOi4O_qTZndnapSjTjiI8k3KfrT6rCkCkj0a4uoA6tVr2-mbEEypXnLcSlUmMuvzjrXY2Ixv2iIUWBwawFN7TXU";

export function usePushNotification() {
  const [loading, setLoading] = useState(false);

  // Helper: Convert Key
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

  // Main Function to Subscribe
  const subscribeToPush = async (userId: string) => {
    if (!('serviceWorker' in navigator)) return;
    setLoading(true);

    try {
      console.log("Requesting Notification Permission...");
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert("Permission denied!");
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // 1. Google se subscription lo
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      console.log("✅ Got Subscription from Google:", subscription);

      // 2. Supabase DB mein save karo
      const subJson = subscription.toJSON();
      
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth
      }, { onConflict: 'user_id, endpoint' });

      if (error) throw error;

      console.log("✅ Saved to Database!");
      alert("Notifications Enabled Successfully! 🚀");
      
    } catch (error) {
      console.error("❌ Setup Failed:", error);
      alert("Failed to enable notifications. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return { subscribeToPush, loading };
}
