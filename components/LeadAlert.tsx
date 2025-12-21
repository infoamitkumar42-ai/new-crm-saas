// =====================================================
// src/components/LeadAlert.tsx
// Clean & Professional Lead Alert Component
// =====================================================

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { usePushNotification } from '../hooks/usePushNotification';
import { X, Volume2, VolumeX } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  mobile?: string;
  city?: string;
  created_at: string;
}

interface AlertState {
  show: boolean;
  lead: Lead | null;
}

const ONLINE_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export const LeadAlert: React.FC = () => {
  const { session } = useAuth();
  
  // Push Notification Hook
  const pushNotification = usePushNotification();
  
  // Local State
  const [alert, setAlert] = useState<AlertState>({ show: false, lead: null });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);

  // ─────────────────────────────────────────────────
  // Audio Setup
  // ─────────────────────────────────────────────────
  useEffect(() => {
    audioRef.current = new Audio(ONLINE_SOUND_URL); 
    audioRef.current.volume = 1.0;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Unlock audio on first user interaction
  useEffect(() => {
    const unlockAudio = () => {
      if (!audioUnlockedRef.current && audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current!.pause();
          audioRef.current!.currentTime = 0;
          audioUnlockedRef.current = true;
          console.log("🔊 Audio unlocked");
        }).catch((e) => console.log("Audio unlock failed", e));
      }
    };
    
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });
    
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // ─────────────────────────────────────────────────
  // Supabase Realtime Subscription (In-App Alerts)
  // ─────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.user) return;
    
    console.log("📡 Setting up Supabase Realtime...");
    
    const channel = supabase
      .channel('leads-realtime-alert')
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'leads' },
        async (payload) => {
          console.log("📩 New lead received:", payload.new);
          const lead = payload.new as Lead;
          await triggerInAppAlert(lead);
        }
      )
      .subscribe((status) => {
        console.log("📡 Realtime status:", status);
      });
    
    return () => { 
      console.log("📡 Cleaning up Realtime...");
      supabase.removeChannel(channel); 
    };
  }, [session, soundEnabled]);

  // ─────────────────────────────────────────────────
  // Trigger In-App Alert (Sound + Banner)
  // ─────────────────────────────────────────────────
  const triggerInAppAlert = async (lead: Lead) => {
    console.log("🔔 Triggering in-app alert for:", lead.name);
    
    // Play Sound
    if (soundEnabled && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        console.log("🔊 Sound played");
      } catch (e) {
        console.log("🔇 Sound play failed:", e);
      }
    }
    
    // Show Banner
    setAlert({ show: true, lead });
    
    // Vibrate
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
      setAlert(prev => prev.lead?.id === lead.id ? { show: false, lead: null } : prev);
    }, 8000);
  };

  // ─────────────────────────────────────────────────
  // Dismiss Alert
  // ─────────────────────────────────────────────────
  const dismissAlert = () => {
    setAlert({ show: false, lead: null });
  };

  // ─────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────
  return (
    <>
      {/* ═══════════════════════════════════════════════════
          IN-APP LEAD ALERT BANNER
          ═══════════════════════════════════════════════════ */}
      {alert.show && alert.lead && (
        <div className="fixed top-16 left-0 w-full z-[9998] flex justify-center pointer-events-none px-4">
          <div className="pointer-events-auto w-full max-w-sm bg-gradient-to-r from-green-600 to-emerald-500 text-white p-4 rounded-2xl shadow-2xl border border-green-400/30"
               style={{ animation: 'slideDown 0.3s ease-out' }}>
            <div className="flex items-start justify-between gap-3">
              {/* Lead Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                  <span className="text-2xl">🔥</span>
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight">New Lead!</p>
                  <p className="font-semibold text-white/95">{alert.lead.name}</p>
                  {alert.lead.city && (
                    <p className="text-sm text-green-100 mt-0.5">📍 {alert.lead.city}</p>
                  )}
                </div>
              </div>
              
              {/* Close Button */}
              <button 
                onClick={dismissAlert} 
                className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          SOUND TOGGLE BUTTON (Small, Bottom Corner)
          ═══════════════════════════════════════════════════ */}
      {session && (
        <button 
          onClick={() => setSoundEnabled(prev => !prev)}
          className="fixed bottom-6 right-6 z-50 p-3 bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-all"
          title={soundEnabled ? "Mute Sound" : "Enable Sound"}
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 text-green-600" />
          ) : (
            <VolumeX className="w-5 h-5 text-gray-400" />
          )}
        </button>
      )}

      {/* Animation Keyframes */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default LeadAlert;
