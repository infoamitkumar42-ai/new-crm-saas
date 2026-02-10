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
import { X, Volume2, VolumeX, Bell } from 'lucide-react';
import { usePushNotification } from '../hooks/usePushNotification';
const SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export const LeadAlert: React.FC = () => {
  const { session } = useAuth();

  // 🔥 CRITICAL FIX: Hide Notification Bell on iOS completely
  // prevents iPhone users from ever entering the "Stuck" state.
  const isIOS = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
  if (isIOS) return null;

  const { isSubscribed, isLoading, permission, subscribe } = usePushNotification();
  const [banner, setBanner] = useState<{ show: boolean; lead: any | null }>({ show: false, lead: null });
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastCheckTimeRef = useRef<string>(new Date().toISOString());
  const playedLeadsRef = useRef<Set<string>>(new Set());

  // 🔥 FIX: Hide Alert Button if not logged in
  const shouldRender = !!session?.user;

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

  // ✅ SUBSCRIBE TO PUSH (Using Hook)
  const handleSubscribe = async () => {
    if (!session?.user) return;
    if (permission === 'denied') {
      alert("⚠️ Notifications are Blocked! Unblock from browser settings.");
      return;
    }
    await subscribe();
  };

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
        {!isSubscribed && permission !== 'denied' && (
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="pointer-events-auto flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all animate-bounce-slow"
          >
            {isLoading ? (
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
