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
  created_at: string;
}

// Online Sound URL (Koi file download karne ki zarurat nahi)
const SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export const LeadAlert: React.FC = () => {
  const { session } = useAuth();
  const [alert, setAlert] = useState<{ show: boolean; lead: Lead | null }>({ show: false, lead: null });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio Setup
  useEffect(() => {
    audioRef.current = new Audio(SOUND_URL);
    audioRef.current.volume = 1.0;
    // Mobile browsers ke liye sound unlock logic
    const unlock = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
            audioRef.current?.pause();
            audioRef.current!.currentTime = 0;
        }).catch(() => {});
      }
    };
    document.addEventListener('click', unlock, { once: true });
    return () => { document.removeEventListener('click', unlock); };
  }, []);

  // ✅ REALTIME LISTENER (Isme filter laga hai taaki error na aaye)
  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = session.user.id;
    console.log("🟢 Starting Listener for User:", userId);

    const channel = supabase
      .channel(`leads-tracker-${userId}`) 
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
          // 👇 SABSE ZAROORI LINE (Iske bina Mismatch Error aata hai)
          filter: `user_id=eq.${userId}` 
        },
        (payload) => {
          console.log("🔥 NEW LEAD RECEIVED:", payload.new);
          triggerAlert(payload.new as Lead);
        }
      )
      .subscribe((status) => {
        console.log(`📡 Connection Status: ${status}`);
        if (status === "SUBSCRIBED") console.log("✅ Ready to receive alerts!");
      });

    return () => {
      console.log("🔴 Cleaning up...");
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const triggerAlert = async (lead: Lead) => {
    // 1. Play Sound
    if (soundEnabled && audioRef.current) {
        try {
            audioRef.current.currentTime = 0;
            await audioRef.current.play();
        } catch (e) { console.error("Audio failed", e); }
    }

    // 2. Show Banner
    setAlert({ show: true, lead });

    // 3. Vibrate Phone
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);

    // 4. System Notification
    if (Notification.permission === 'granted') {
         new Notification('🔥 New Lead!', {
            body: `${lead.name} from ${lead.city || 'Website'}`,
            icon: '/vite.svg'
        });
    }

    // Auto hide after 10 seconds
    setTimeout(() => {
      setAlert((prev) => (prev.lead?.id === lead.id ? { show: false, lead: null } : prev));
    }, 10000);
  };

  return (
    <>
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
    </>
  );
};

export default LeadAlert;
