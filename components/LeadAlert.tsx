// =====================================================
// src/components/LeadAlert.tsx
// FIXED - No Icon Issues
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

  // Mount Log
  useEffect(() => {
    console.log("🚀 [LeadAlert] Mounted");
  }, []);

  // Audio Setup
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

  // Trigger Alert
  const triggerAlert = useCallback(async (lead: Lead) => {
    if (lastLeadIdRef.current === lead.id) return;
    lastLeadIdRef.current = lead.id;

    console.log("🔔 NEW LEAD:", lead.name);

    // 1. Sound
    if (soundEnabled && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        console.log("🔊 Sound OK");
      } catch (e) {
        console.log("🔇 Sound blocked - click anywhere first");
      }
    }

    // 2. Banner
    setAlert({ show: true, lead });

    // 3. Vibrate
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    // 4. System Notification (WITHOUT icon to avoid error)
    if (Notification.permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification('🔥 New Lead: ' + lead.name, {
          body: lead.city ? `📍 ${lead.city}` : 'New lead received!',
          tag: 'lead-' + lead.id,
          vibrate: [200, 100, 200],
          requireInteraction: true
        });
        console.log("✅ Notification SENT!");
      } catch (e) {
        console.error("❌ Notification failed:", e);
      }
    } else {
      console.log("⚠️ Permission not granted:", Notification.permission);
    }

    // Auto hide
    setTimeout(() => {
      setAlert(prev => prev.lead?.id === lead.id ? { show: false, lead: null } : prev);
    }, 10000);
  }, [soundEnabled]);

  // Polling
  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = session.user.id;
    console.log("📡 Polling for:", userId);

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
          lastCheckTimeRef.current = newLead.created_at;
          triggerAlert(newLead);
        }
      } catch (e) {
        console.error("❌ Poll error:", e);
      }
    };

    checkNewLeads();
    const interval = setInterval(checkNewLeads, 5000);
    console.log("✅ Polling started");

    return () => clearInterval(interval);
  }, [session?.user?.id, triggerAlert]);

  return (
    <>
      {/* Banner */}
      {alert.show && alert.lead && (
        <div className="fixed top-16 left-0 w-full z-[9999] flex justify-center px-4">
          <div className="w-full max-w-md bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                🔥
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">New Lead!</p>
                <p className="font-semibold">{alert.lead.name}</p>
                {alert.lead.city && (
                  <p className="text-sm text-green-100">📍 {alert.lead.city}</p>
                )}
              </div>
              <button
                onClick={() => setAlert({ show: false, lead: null })}
                className="p-2 bg-white/20 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sound Toggle */}
      <button
        onClick={() => setSoundEnabled(p => !p)}
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
