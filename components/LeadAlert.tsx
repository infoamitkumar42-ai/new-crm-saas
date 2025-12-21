// =====================================================
// src/components/LeadAlert.tsx
// FIXED VERSION - Server-Side Filtering (Fixes Mismatch Error)
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

  // Audio Setup (Same as before - works well)
  useEffect(() => {
    audioRef.current = new Audio(SOUND_URL);
    audioRef.current.volume = 1.0;

    const unlock = () => {
      audioRef.current?.play().then(() => {
        audioRef.current?.pause();
        if (audioRef.current) audioRef.current.currentTime = 0;
      }).catch(() => {});
    };

    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });

    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
  }, []);

  // ✅ SUPABASE REALTIME (The Fix)
  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = session.user.id;
    console.log("📡 [LeadAlert] Subscribing for User:", userId);

    const channel = supabase
      .channel(`leads-tracker-${userId}`) 
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          // 👇 KEY FIX: Server-Side Filter!
          // This tells Supabase: "Only send events where user_id matches MY ID"
          // This prevents the "mismatch bindings" error.
          filter: `user_id=eq.${userId}` 
        },
        (payload) => {
          console.log("🔥 [LeadAlert] Realtime Event:", payload);
          const newLead = payload.new as Lead;
          triggerAlert(newLead);
        }
      )
      .subscribe((status) => {
        console.log(`📡 [LeadAlert] Connection Status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log("✅ Ready to receive leads!");
        }
      });

    return () => {
      console.log("🔌 Disconnecting...");
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const triggerAlert = async (lead: Lead) => {
    // 1. Play Sound
    if (soundEnabled && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      } catch (e) { console.error("Audio error", e); }
    }

    // 2. Show Banner
    setAlert({ show: true, lead });

    // 3. Vibrate
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    // 4. System Notification
    if (Notification.permission === 'granted') {
      new Notification('🔥 New Lead Assigned!', {
        body: `${lead.name} from ${lead.city || 'Website'}`,
        icon: '/vite.svg' 
      });
    }

    // Auto hide
    setTimeout(() => {
      setAlert((prev) => (prev.lead?.id === lead.id ? { show: false, lead: null } : prev));
    }, 10000);
  };

  return (
    <>
      {/* Alert Banner */}
      {alert.show && alert.lead && (
        <div className="fixed top-14 left-0 w-full z-[9999] flex justify-center px-3 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-md bg-green-600 text-white p-4 rounded-xl shadow-2xl animate-bounce flex items-center gap-3">
             <div className="text-3xl">🔥</div>
             <div className="flex-1">
               <p className="font-bold">New Lead Assigned!</p>
               <p>{alert.lead.name} <span className="opacity-75 text-sm">({alert.lead.city})</span></p>
             </div>
             <button onClick={() => setAlert({ show: false, lead: null })}>
               <X className="w-6 h-6" />
             </button>
          </div>
        </div>
      )}

      {/* Sound Toggle */}
      <button
        onClick={() => setSoundEnabled((p) => !p)}
        className="fixed bottom-6 right-6 z-50 p-3 bg-white text-gray-800 rounded-full shadow-lg border border-gray-200"
      >
        {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </button>
    </>
  );
};

export default LeadAlert;
