// =====================================================
// src/components/LeadAlert.tsx
// SIMPLIFIED VERSION - FOR DEBUGGING
// =====================================================

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { X, Volume2, VolumeX } from 'lucide-react';

interface Lead {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  city?: string;
  source?: string;
  created_at: string;
}

const SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export const LeadAlert: React.FC = () => {
  const { session } = useAuth();
  const [alert, setAlert] = useState<{ show: boolean; lead: Lead | null }>({ show: false, lead: null });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ─────────────────────────────────────────────────
  // Component Mount Log
  // ─────────────────────────────────────────────────
  useEffect(() => {
    console.log("🚀 [LeadAlert] Component MOUNTED");
    console.log("🔑 [LeadAlert] Session:", session?.user?.id ? "YES" : "NO");
    
    return () => {
      console.log("💀 [LeadAlert] Component UNMOUNTED");
    };
  }, []);

  // ─────────────────────────────────────────────────
  // Audio Setup
  // ─────────────────────────────────────────────────
  useEffect(() => {
    audioRef.current = new Audio(SOUND_URL);
    audioRef.current.volume = 1.0;
    
    // Unlock audio on click
    const unlock = () => {
      audioRef.current?.play().then(() => {
        audioRef.current?.pause();
        if (audioRef.current) audioRef.current.currentTime = 0;
        console.log("🔊 [LeadAlert] Audio unlocked");
      }).catch(() => {});
    };
    
    document.addEventListener('click', unlock, { once: true });
    
    return () => {
      document.removeEventListener('click', unlock);
    };
  }, []);

  // ─────────────────────────────────────────────────
  // Supabase Realtime - SIMPLE VERSION
  // ─────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.id) {
      console.log("❌ [LeadAlert] No session, skipping subscription");
      return;
    }

    const userId = session.user.id;
    console.log("📡 [LeadAlert] Setting up Realtime for user:", userId);

    const channel = supabase
      .channel('leads-channel-v2')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log("📩 [LeadAlert] INSERT received:", payload);
          const lead = payload.new as Lead;
          
          // Check if this lead is for current user
          if (lead.user_id === userId) {
            console.log("✅ [LeadAlert] This lead is for ME!");
            triggerAlert(lead);
          } else {
            console.log("⏭️ [LeadAlert] Lead is for another user:", lead.user_id);
          }
        }
      )
      .subscribe((status, err) => {
        console.log("📡 [LeadAlert] Channel Status:", status);
        if (err) {
          console.error("❌ [LeadAlert] Channel Error:", err);
        }
      });

    return () => {
      console.log("🔌 [LeadAlert] Removing channel");
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  // ─────────────────────────────────────────────────
  // Trigger Alert
  // ─────────────────────────────────────────────────
  const triggerAlert = async (lead: Lead) => {
    console.log("🔔 [LeadAlert] TRIGGERING ALERT FOR:", lead.name);

    // 1. Sound
    if (soundEnabled && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        console.log("🔊 [LeadAlert] Sound played!");
      } catch (e) {
        console.log("🔇 [LeadAlert] Sound failed");
      }
    }

    // 2. Banner
    setAlert({ show: true, lead });

    // 3. Vibrate
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    // 4. System Notification
    if (Notification.permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification('🔥 New Lead!', {
          body: `${lead.name}${lead.city ? ` from ${lead.city}` : ''}`,
          icon: '/vite.svg',
          tag: `lead-${lead.id}`,
          vibrate: [200, 100, 200],
          requireInteraction: true
        });
        console.log("✅ [LeadAlert] System notification shown!");
      } catch (e) {
        console.error("❌ [LeadAlert] System notification failed:", e);
      }
    }

    // Auto hide
    setTimeout(() => {
      setAlert({ show: false, lead: null });
    }, 10000);
  };

  // ─────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────
  return (
    <>
      {/* Alert Banner */}
      {alert.show && alert.lead && (
        <div className="fixed top-14 left-0 w-full z-[9999] flex justify-center px-3">
          <div className="w-full max-w-md bg-gradient-to-r from-green-600 to-emerald-500 text-white p-4 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                🔥
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">New Lead!</p>
                <p className="font-medium">{alert.lead.name}</p>
                {alert.lead.city && (
                  <p className="text-sm text-green-100">📍 {alert.lead.city}</p>
                )}
              </div>
              <button
                onClick={() => setAlert({ show: false, lead: null })}
                className="p-2 bg-black/10 hover:bg-black/20 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sound Toggle */}
      <button
        onClick={() => setSoundEnabled((p) => !p)}
        className="fixed bottom-6 right-6 z-50 p-3 bg-white rounded-full shadow-lg border"
      >
        {soundEnabled ? (
          <Volume2 className="w-5 h-5 text-green-600" />
        ) : (
          <VolumeX className="w-5 h-5 text-gray-400" />
        )}
      </button>
    </>
  );
};

export default LeadAlert;
