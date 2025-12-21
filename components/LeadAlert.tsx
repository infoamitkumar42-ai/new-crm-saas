// =====================================================
// src/components/LeadAlert.tsx
// POLLING METHOD - 100% Reliable
// =====================================================

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
const POLL_INTERVAL = 5000; // 5 seconds

export const LeadAlert: React.FC = () => {
  const { session } = useAuth();
  const [alert, setAlert] = useState<{ show: boolean; lead: Lead | null }>({ 
    show: false, 
    lead: null 
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastLeadIdRef = useRef<string | null>(null);
  const lastCheckTimeRef = useRef<string>(new Date().toISOString());

  // ─────────────────────────────────────────────────
  // Mount Log
  // ─────────────────────────────────────────────────
  useEffect(() => {
    console.log("🚀 [LeadAlert] Mounted - Polling Mode");
    return () => console.log("💀 [LeadAlert] Unmounted");
  }, []);

  // ─────────────────────────────────────────────────
  // Audio Setup
  // ─────────────────────────────────────────────────
  useEffect(() => {
    audioRef.current = new Audio(SOUND_URL);
    audioRef.current.volume = 1.0;

    const unlock = () => {
      if (audioRef.current) {
        audioRef.current.play()
          .then(() => {
            audioRef.current?.pause();
            audioRef.current!.currentTime = 0;
            console.log("🔊 Audio unlocked");
          })
          .catch(() => {});
      }
    };

    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });

    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
  }, []);

  // ─────────────────────────────────────────────────
  // Trigger Alert
  // ─────────────────────────────────────────────────
  const triggerAlert = useCallback(async (lead: Lead) => {
    // Prevent duplicate
    if (lastLeadIdRef.current === lead.id) return;
    lastLeadIdRef.current = lead.id;

    console.log("🔔 [LeadAlert] NEW LEAD:", lead.name, lead.city);

    // 1. Sound
    if (soundEnabled && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        console.log("🔊 Sound played!");
      } catch (e) {
        console.log("🔇 Sound blocked");
      }
    }

    // 2. Show Banner
    setAlert({ show: true, lead });

    // 3. Vibrate
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // 4. System Notification
    if (Notification.permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification('🔥 New Lead!', {
          body: `${lead.name}${lead.city ? ` from ${lead.city}` : ''}`,
          icon: '/vite.svg',
          badge: '/vite.svg',
          tag: `lead-${lead.id}`,
          vibrate: [200, 100, 200],
          requireInteraction: true,
          data: { url: '/', leadId: lead.id }
        });
        console.log("✅ System notification shown!");
      } catch (e) {
        console.log("❌ Notification failed:", e);
      }
    }

    // Auto hide after 10 seconds
    setTimeout(() => {
      setAlert(prev => 
        prev.lead?.id === lead.id ? { show: false, lead: null } : prev
      );
    }, 10000);
  }, [soundEnabled]);

  // ─────────────────────────────────────────────────
  // POLLING - Check for new leads
  // ─────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.id) {
      console.log("❌ [LeadAlert] No user session");
      return;
    }

    const userId = session.user.id;
    console.log("📡 [LeadAlert] Starting polling for:", userId);

    const checkNewLeads = async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', userId)
          .gt('created_at', lastCheckTimeRef.current)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error("❌ Query error:", error.message);
          return;
        }

        if (data && data.length > 0) {
          const newLead = data[0];
          console.log("📩 New lead found:", newLead.name);
          
          // Update last check time
          lastCheckTimeRef.current = newLead.created_at;
          
          // Trigger alert
          triggerAlert(newLead);
        }
      } catch (e) {
        console.error("❌ Polling error:", e);
      }
    };

    // Initial check
    checkNewLeads();

    // Start polling
    const interval = setInterval(checkNewLeads, POLL_INTERVAL);
    console.log(`✅ [LeadAlert] Polling every ${POLL_INTERVAL/1000}s`);

    return () => {
      console.log("🔌 [LeadAlert] Stopping polling");
      clearInterval(interval);
    };
  }, [session?.user?.id, triggerAlert]);

  // ─────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────
  return (
    <>
      {/* ══════════════════════════════════════════════
          LEAD ALERT BANNER
          ══════════════════════════════════════════════ */}
      {alert.show && alert.lead && (
        <div className="fixed top-16 left-0 w-full z-[9999] flex justify-center px-4 pointer-events-none">
          <div 
            className="pointer-events-auto w-full max-w-md bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-2xl shadow-2xl border border-white/20"
            style={{
              animation: 'slideDown 0.4s ease-out, pulse 2s infinite'
            }}
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">🔥</span>
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xl">New Lead!</p>
                <p className="font-semibold text-lg truncate">{alert.lead.name}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {alert.lead.city && (
                    <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
                      📍 {alert.lead.city}
                    </span>
                  )}
                  {alert.lead.source && (
                    <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
                      📣 {alert.lead.source}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Close Button */}
              <button
                onClick={() => setAlert({ show: false, lead: null })}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors flex-shrink-0"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          SOUND TOGGLE
          ══════════════════════════════════════════════ */}
      <button
        onClick={() => setSoundEnabled(prev => !prev)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-white rounded-full shadow-xl border-2 border-gray-100 hover:scale-110 transition-transform"
        title={soundEnabled ? "Mute Sound" : "Enable Sound"}
      >
        {soundEnabled ? (
          <Volume2 className="w-6 h-6 text-green-600" />
        ) : (
          <VolumeX className="w-6 h-6 text-gray-400" />
        )}
      </button>

      {/* Animations */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
          }
        }
      `}</style>
    </>
  );
};

export default LeadAlert;
