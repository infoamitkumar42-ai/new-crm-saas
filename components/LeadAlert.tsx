/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 LOCKED - LeadAlert.tsx vFinal (User Friendly)          ║
 * ║  Status: PRODUCTION READY                                  ║
 * ║  Change: Better instructions for blocked users             ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { X, Volume2, VolumeX, Bell, Check } from 'lucide-react';

const PUBLIC_VAPID_KEY = 'BJkGd-k1-IQB-WO6jwTsj6XaZYXny8W4bxd4PQ1TEv6blS5AlR_PlBURJiTsf1cC7qpZ7E2QQUAo611f4PoOS58';
const SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

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

  const [banner, setBanner] = useState<{ show: boolean; lead: any | null }>({ show: false, lead: null });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastCheckTimeRef = useRef<string>(new Date().toISOString());
  const playedLeadsRef = useRef<Set<string>>(new Set());

  // 🔥 Hard Stop for iOS in rendering
  const isIOS = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  // 🔥 FIX: Hide Alert Button if not logged in or if on iOS
  // If we return early, hooks count mismatch occurs -> React Crash
  const shouldRender = !!session?.user && !isIOS;

  // Audio Init - FIXED: Only LOAD audio, don't play on click
  useEffect(() => {
    audioRef.current = new Audio(SOUND_URL);
    audioRef.current.volume = 0.7;

    // Check Initial Permission
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }

    // 🔥 FIX: Just unlock audio context without playing
    const unlockAudio = () => {
      if (audioRef.current) {
        // Create silent play to unlock audio context (required by browsers)
        audioRef.current.muted = true;
        audioRef.current.play().then(() => {
          audioRef.current!.pause();
          audioRef.current!.currentTime = 0;
          audioRef.current!.muted = false;
        }).catch(() => { });
      }
    };

    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // ✅ SUBSCRIBE TO PUSH
  const subscribeToPush = async () => {
    if (!session?.user) return;

    // Refresh permission status
    if ('Notification' in window) {
      const currentPerm = Notification.permission;
      setPermissionStatus(currentPerm);
      if (currentPerm === 'denied') {
        alert("⚠️ Notifications are Blocked! Unblock from browser settings.");
        return;
      }
    }

    setLoading(true);

    try {
      if (!('serviceWorker' in navigator)) {
        throw new Error("Service Worker not supported");
      }

      if (typeof window === 'undefined' || !('Notification' in window)) {
        throw new Error("Notifications not supported");
      }

      const reg = await navigator.serviceWorker.ready;

      // Wrap subscription in a timeout to prevent infinite hang
      const sub = await Promise.race([
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Subscription Timeout")), 8000))
      ]) as PushSubscription;

      const p256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(sub.getKey('p256dh')!))));
      const auth = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(sub.getKey('auth')!))));

      // 🔥 FIX: Delete any OTHER user's subscriptions with same endpoint
      await supabase.from('push_subscriptions')
        .delete()
        .eq('endpoint', sub.endpoint)
        .neq('user_id', session.user.id);

      await supabase.from('push_subscriptions').upsert({
        user_id: session.user.id,
        endpoint: sub.endpoint,
        p256dh: p256dh,
        auth: auth
      }, { onConflict: 'user_id, endpoint' });

      setIsSubscribed(true);

      if (window.Notification.permission === 'granted') {
        new window.Notification("Notifications Enabled", {
          body: "You will now receive leads even when screen is off.",
          icon: "/icon-192x192.png"
        });
      }

    } catch (err: any) {
      console.error("Subscription failed:", err);
      // Soft Fail: Just show a message, don't block the UI
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert("⚠️ iOS Connection: Please ensure you are using 'Add to Home Screen' and have enabled notifications in Settings > Safari.");
      } else {
        alert(`⚠️ Notification Error: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check Status on Mount
  // Check Status on Mount & Auto-Sync
  useEffect(() => {
    if ('serviceWorker' in navigator && session?.user) {
      console.log("🔔 [LeadAlert] Checking Service Worker...");
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(async sub => {
          if (sub) {
            console.log("✅ [LeadAlert] Found existing subscription");
            setIsSubscribed(true);

            // 🔥 AUTO-SYNC: Ensure DB matches Client (Safe Mode)
            try {
              const p256dhKey = sub.getKey('p256dh');
              const authKey = sub.getKey('auth');

              if (!p256dhKey || !authKey) {
                console.warn("⚠️ [LeadAlert] Missing keys in subscription");
                return;
              }

              const p256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhKey))));
              const auth = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authKey))));

              // 🔥 FIX: Clean up OTHER users' subscriptions with same endpoint
              await supabase.from('push_subscriptions')
                .delete()
                .eq('endpoint', sub.endpoint)
                .neq('user_id', session.user.id);

              await supabase.from('push_subscriptions').upsert({
                user_id: session.user.id,
                endpoint: sub.endpoint,
                p256dh: p256dh,
                auth: auth
              }, { onConflict: 'user_id, endpoint' });

              console.log("🔄 [LeadAlert] Auto-Synced Subscription to DB");
            } catch (e) {
              console.error("❌ [LeadAlert] Auto-sync failed", e);
            }
          } else {
            console.log("ℹ️ [LeadAlert] No subscription found");
          }
        });
      });
    }
  }, [session?.user]);

  // 📡 POLLING BACKUP - Fixed to prevent duplicate sounds
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
        const leadId = newLead.id;

        // Update last check time
        lastCheckTimeRef.current = newLead.created_at;

        // 🔥 Only play sound if this lead hasn't been played before
        if (!playedLeadsRef.current.has(leadId)) {
          playedLeadsRef.current.add(leadId);

          // Prevent Set from growing indefinitely (keep last 100)
          if (playedLeadsRef.current.size > 100) {
            const firstItem = playedLeadsRef.current.values().next().value;
            if (firstItem) playedLeadsRef.current.delete(firstItem);
          }

          if (soundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => { });
          }

          setBanner({ show: true, lead: newLead });

          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

          setTimeout(() => setBanner({ show: false, lead: null }), 8000);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [session?.user?.id, soundEnabled]);

  // 🛑 STOP RENDERING IF NOT LOGGED IN
  if (!shouldRender) return null;

  return (
    <>
      {/* Banner */}
      {banner.show && banner.lead && (
        <div className="fixed top-4 left-0 w-full z-[9999] flex justify-center px-4 animate-slide-down">
          <div className="w-full max-w-md bg-gradient-to-r from-gray-900 to-slate-800 text-white p-4 rounded-xl shadow-2xl border-l-4 border-green-500 flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-full animate-pulse">🔥</div>
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

      {/* 🔔 Floating Controls (Minimal) */}
      <div className="fixed bottom-24 right-4 z-[990] flex flex-col items-end gap-3 pointer-events-none">

        {/* Enable Push Button (Only if not subscribed) */}
        {!isSubscribed && permissionStatus !== 'denied' && (
          <button
            onClick={subscribeToPush}
            disabled={loading}
            className="pointer-events-auto flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all animate-bounce-slow"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Bell size={20} className="fill-indigo-100" />
            )}
            <span className="font-bold text-sm">Enable Alerts</span>
          </button>
        )}

        {/* Sound Toggle (Small Pill) */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`pointer-events-auto p-3 rounded-full shadow-md transition-all active:scale-90 ${soundEnabled
            ? 'bg-white text-slate-700 hover:bg-slate-50'
            : 'bg-slate-100 text-slate-400'
            }`}
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>
    </>
  );
};

export default LeadAlert;
