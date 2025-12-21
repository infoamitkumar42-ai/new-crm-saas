// =====================================================
// src/components/LeadAlert.tsx
// Lead Alert - Only for Assigned User
// =====================================================

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { X, Volume2, VolumeX } from 'lucide-react';

interface Lead {
  id: string;
  user_id: string;  // 👈 Important: जिस user को assign हुई
  name: string;
  phone?: string;
  city?: string;
  source?: string;
  status?: string;
  created_at: string;
}

interface AlertState {
  show: boolean;
  lead: Lead | null;
}

const SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export const LeadAlert: React.FC = () => {
  const { session } = useAuth();
  
  // State
  const [alert, setAlert] = useState<AlertState>({ show: false, lead: null });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // ─────────────────────────────────────────────────
  // Service Worker Setup
  // ─────────────────────────────────────────────────
  useEffect(() => {
    const setupSW = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          swRegistrationRef.current = registration;
          console.log("✅ [LeadAlert] SW Ready");
        } catch (e) {
          console.log("❌ [LeadAlert] SW error:", e);
        }
      }
    };
    setupSW();
  }, []);

  // ─────────────────────────────────────────────────
  // Audio Setup
  // ─────────────────────────────────────────────────
  useEffect(() => {
    audioRef.current = new Audio(SOUND_URL); 
    audioRef.current.volume = 1.0;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Unlock audio on first touch/click
  useEffect(() => {
    const unlockAudio = () => {
      if (!audioUnlockedRef.current && audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current!.pause();
          audioRef.current!.currentTime = 0;
          audioUnlockedRef.current = true;
          console.log("🔊 [LeadAlert] Audio unlocked");
        }).catch(() => {});
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
  // 🎯 Supabase Realtime - ONLY MY LEADS
  // ─────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const currentUserId = session.user.id;
    console.log("📡 [LeadAlert] Subscribing for user:", currentUserId);
    
    const channel = supabase
      .channel('my-leads-channel')
      .on(
        'postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'leads',
          filter: `user_id=eq.${currentUserId}`  // 👈 FILTER: Only MY leads
        },
        async (payload) => {
          console.log("📩 [LeadAlert] New lead for ME:", payload.new);
          const lead = payload.new as Lead;
          await triggerAlert(lead);
        }
      )
      .subscribe((status) => {
        console.log("📡 [LeadAlert] Subscription status:", status);
      });
    
    return () => { 
      console.log("📡 [LeadAlert] Unsubscribing...");
      supabase.removeChannel(channel); 
    };
  }, [session?.user?.id, soundEnabled]);

  // ─────────────────────────────────────────────────
  // Trigger All Alerts
  // ─────────────────────────────────────────────────
  const triggerAlert = async (lead: Lead) => {
    console.log("🔔 [LeadAlert] Triggering alert for:", lead.name);
    
    // 1️⃣ Play Sound
    if (soundEnabled && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        console.log("🔊 [LeadAlert] Sound played");
      } catch (e) {
        console.log("🔇 [LeadAlert] Sound failed");
      }
    }
    
    // 2️⃣ Show In-App Banner
    setAlert({ show: true, lead });
    
    // 3️⃣ Vibrate
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
    
    // 4️⃣ System Notification (Status Bar)
    await showSystemNotification(lead);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      setAlert(prev => prev.lead?.id === lead.id ? { show: false, lead: null } : prev);
    }, 10000);
  };

  // ─────────────────────────────────────────────────
  // System Notification
  // ─────────────────────────────────────────────────
  const showSystemNotification = async (lead: Lead) => {
    if (Notification.permission !== 'granted') {
      console.log("❌ [LeadAlert] Permission not granted");
      return;
    }

    if (!swRegistrationRef.current) {
      console.log("❌ [LeadAlert] SW not ready");
      return;
    }

    try {
      await swRegistrationRef.current.showNotification('🔥 New Lead Assigned!', {
        body: `${lead.name}${lead.city ? ` from ${lead.city}` : ''}\n${lead.source ? `Source: ${lead.source}` : ''}`,
        icon: '/vite.svg',
        badge: '/vite.svg',
        tag: `lead-${lead.id}`,
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true,
        data: {
          url: '/',
          leadId: lead.id
        }
      });
      console.log("✅ [LeadAlert] System notification shown!");
    } catch (e) {
      console.error("❌ [LeadAlert] Notification error:", e);
    }
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
        <div className="fixed top-14 left-0 w-full z-[9998] flex justify-center pointer-events-none px-3">
          <div 
            className="pointer-events-auto w-full max-w-md bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 text-white p-4 rounded-2xl shadow-2xl border border-white/20"
            style={{ animation: 'slideDown 0.4s ease-out' }}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">🔥</span>
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg">New Lead!</p>
                <p className="font-semibold text-white/95 truncate">{alert.lead.name}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {alert.lead.city && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      📍 {alert.lead.city}
                    </span>
                  )}
                  {alert.lead.source && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      📣 {alert.lead.source}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Close */}
              <button 
                onClick={() => setAlert({ show: false, lead: null })} 
                className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          SOUND TOGGLE BUTTON
          ═══════════════════════════════════════════════════ */}
      {session && (
        <button 
          onClick={() => setSoundEnabled(prev => !prev)}
          className="fixed bottom-6 right-6 z-50 p-3 bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-all active:scale-95"
          title={soundEnabled ? "Mute Sound" : "Enable Sound"}
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 text-green-600" />
          ) : (
            <VolumeX className="w-5 h-5 text-gray-400" />
          )}
        </button>
      )}

      {/* Animation */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default LeadAlert;
