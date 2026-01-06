/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 LOCKED - LeadAlert.tsx vFinal (Bug Fixed)              ║
 * ║  Status: STRONG - VAPID PUSH ENABLED                       ║
 * ║  Fix: Renamed 'alert' state to 'banner' to fix crash       ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { X, Volume2, VolumeX, Bell } from 'lucide-react';

// 🔑 YOUR GENERATED PUBLIC KEY
const PUBLIC_VAPID_KEY = 'BJkGd-k1-IQB-WO6jwTsj6XaZYXny8W4bxd4PQ1TEv6blS5AlR_PlBURJiTsf1cC7qpZ7E2QQUAo611f4PoOS58';

const SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

// Helper to convert key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const LeadAlert: React.FC = () => {
  const { session } = useAuth();
  // 🔥 FIX: Renamed 'alert' to 'banner' to avoid conflict with window.alert()
  const [banner, setBanner] = useState<{ show: boolean; lead: any | null }>({ show: false, lead: null });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastCheckTimeRef = useRef<string>(new Date().toISOString());

  // Audio Init
  useEffect(() => {
    audioRef.current = new Audio(SOUND_URL);
    const unlock = () => { audioRef.current?.play().catch(() => {}); };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
  }, []);

  // ✅ SUBSCRIBE TO PUSH
  const subscribeToPush = async () => {
    if (!session?.user) return;
    setLoading(true);
    
    try {
      if (!('serviceWorker' in navigator)) {
        throw new Error("Service Worker not supported");
      }

      const reg = await navigator.serviceWorker.ready;
      
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });

      const p256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(sub.getKey('p256dh')!))));
      const auth = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(sub.getKey('auth')!))));

      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: session.user.id,
        endpoint: sub.endpoint,
        p256dh: p256dh,
        auth: auth
      }, { onConflict: 'user_id, endpoint' });

      if (error) throw error;

      setIsSubscribed(true);
      console.log("✅ Device Subscribed for Push!");
      
      // Test Notification
      new Notification("Notifications Enabled", {
        body: "You will now receive leads even when screen is off.",
        icon: "/icon-192x192.png"
      });

    } catch (err: any) {
      console.error("Subscription failed:", err);
      // 🔥 FIX: Now window.alert will work because we renamed the state
      window.alert("Please enable notifications in your browser settings (Click the Lock icon 🔒).");
    } finally {
      setLoading(false);
    }
  };

  // Check Status on Mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) setIsSubscribed(true);
        });
      });
    }
  }, []);

  // 📡 POLLING BACKUP
  useEffect(() => {
    if (!session?.user?.id) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', session.user.id)
        .gt('created_at', lastCheckTimeRef.current)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const newLead = data[0];
        lastCheckTimeRef.current = newLead.created_at;
        
        if (soundEnabled && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }

        // Show Banner
        setBanner({ show: true, lead: newLead });
        
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

        setTimeout(() => setBanner({ show: false, lead: null }), 8000);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [session?.user?.id, soundEnabled]);

  return (
    <>
      {/* Top Banner Alert */}
      {banner.show && banner.lead && (
        <div className="fixed top-4 left-0 w-full z-[9999] flex justify-center px-4 animate-slide-down">
          <div className="w-full max-w-md bg-gradient-to-r from-gray-900 to-slate-800 text-white p-4 rounded-xl shadow-2xl border-l-4 border-green-500 flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-full animate-pulse">
              🔥
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-green-400">NEW LEAD ARRIVED</p>
              <p className="font-semibold text-lg">{banner.lead.name}</p>
              <p className="text-xs text-gray-400">{banner.lead.phone} • {banner.lead.city || 'Online'}</p>
            </div>
            <button onClick={() => setBanner({ show: false, lead: null })} className="p-2 hover:bg-white/10 rounded-full">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Controls */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        {!isSubscribed && (
          <button
            onClick={subscribeToPush}
            disabled={loading}
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-600/30 border border-blue-400 animate-bounce transition-all"
            title="Enable Background Alerts"
          >
            {loading ? <span className="animate-spin text-xl">↻</span> : <Bell className="w-6 h-6" />}
          </button>
        )}

        <button
          onClick={() => setSoundEnabled(p => !p)}
          className={`p-3 rounded-full shadow-lg border transition-all ${
            soundEnabled ? 'bg-white text-green-600 border-green-200' : 'bg-gray-100 text-gray-400 border-gray-200'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </button>
      </div>
    </>
  );
};

export default LeadAlert;
