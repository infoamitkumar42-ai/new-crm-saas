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
  const playedLeadsRef = useRef<Set<string>>(new Set()); // Track leads that already played sound

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

      new Notification("Notifications Enabled", {
        body: "You will now receive leads even when screen is off.",
        icon: "/icon-192x192.png"
      });

    } catch (err: any) {
      console.error("Subscription failed:", err);

      // 🔥 BETTER INSTRUCTION MESSAGE FOR USERS
      window.alert(
        "⚠️ Notifications are Blocked!\n\nTo fix this:\n1. Tap the Lock icon 🔒 in address bar.\n2. Tap 'Permissions'.\n3. Turn ON 'Notifications'.\n\nThen refresh the page."
      );
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

      {/* Floating Controls (MOVED TO TOP-RIGHT TO FLX VISIBILITY) */}
      {/* Floating Controls (Always Visible Wrapper) */}
      <div className="fixed bottom-24 right-4 z-[99999] flex flex-col items-end gap-3 isolate">

        {/* Subscribe Button (Hidden if Subscribed AND Not Blocked) */}
        {(!isSubscribed || permissionStatus === 'denied') && (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl animate-bounce whitespace-nowrap ${permissionStatus === 'denied' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
              }`}>
              {permissionStatus === 'denied' ? 'Blocked 🚫' : 'Enable Leads ➡'}
            </span>

            <button
              onClick={() => {
                if (permissionStatus === 'denied') {
                  window.alert("⚠️ Notifications are Blocked by your Browser!\n\nTo unblock:\n1. Click the Lock icon 🔒 in URL bar.\n2. Click 'Permissions'.\n3. Set Notifications to 'Allow'.\n4. Refresh the page.");
                } else {
                  subscribeToPush();
                }
              }}
              className={`p-3.5 rounded-full shadow-2xl border-2 transition-all transform active:scale-95 ${permissionStatus === 'denied' ? 'bg-red-600 text-white border-red-400' : 'bg-blue-600 text-white border-white'
                }`}
              style={{ WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto' }}
            >
              {loading ? <span className="animate-spin text-xl">↻</span> :
                permissionStatus === 'denied' ? <span className="text-xl font-bold">!</span> :
                  <Bell className="w-7 h-7" />
              }
            </button>
          </div>
        )}

        {/* Sound Toggle (Always Visible) */}
        <button
          onClick={() => setSoundEnabled(p => !p)}
          className={`p-3.5 rounded-full shadow-xl border transition-all ${soundEnabled ? 'bg-white text-emerald-600 border-emerald-200' : 'bg-white text-gray-400 border-gray-200'
            }`}
          style={{ WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto' }}
        >
          {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </button>
      </div>
    </>
  );
};

export default LeadAlert;
