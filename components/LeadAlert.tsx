import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { useNotification } from '../hooks/useNotification';
import { X, Bell, Volume2, VolumeX, Smartphone } from 'lucide-react';

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

// 🔊 Base64 Sound (Internal - No Internet Needed)
// Ye ek simple "Ting" sound hai jo hamesha chalegi
const BEEP_SOUND = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // (Shortened for example, full code neeche hai)

export const LeadAlert: React.FC = () => {
  const { session } = useAuth();
  const { 
    permission, 
    isSupported, 
    isReady, 
    requestPermission, 
    showNotification 
  } = useNotification();
  
  const [alert, setAlert] = useState<AlertState>({ show: false, lead: null });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Setup Audio Engine
  useEffect(() => {
    // High Quality "Ping" Sound
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audioRef.current.volume = 1.0;
    
    // Unlock Audio Context (Mobile Requirement)
    const unlock = () => {
      if (audioRef.current && !audioUnlocked) {
        audioRef.current.play().then(() => {
          audioRef.current!.pause();
          audioRef.current!.currentTime = 0;
          setAudioUnlocked(true);
        }).catch(e => console.log("Tap to unlock audio", e));
      }
    };

    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });

    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
  }, [audioUnlocked]);

  // 2. Realtime Listener
  useEffect(() => {
    if (!session?.user) return;

    const channel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads' },
        async (payload) => {
          const lead = payload.new as Lead;
          await triggerAllNotifications(lead);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, permission, isReady, soundEnabled]);

  // 3. Trigger Function
  const triggerAllNotifications = async (lead: Lead) => {
    // A. Play Sound
    if (soundEnabled && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      } catch (e) {
        console.warn('Audio play failed (User needs to tap screen first)', e);
      }
    }

    // B. Show Green Banner
    setAlert({ show: true, lead });

    // C. Vibrate
    if ('vibrate' in navigator) navigator.vibrate([500, 200, 500]);

    // D. System Notification
    if (permission === 'granted' && isReady) {
      showNotification('🔥 New Lead!', {
        body: `${lead.name} from ${lead.city}`,
        icon: '/vite.svg',
        tag: `lead-${lead.id}`,
        url: '/'
      });
    }

    setTimeout(() => setAlert(prev => prev.lead?.id === lead.id ? { show: false, lead: null } : prev), 8000);
  };

  const handleTest = () => {
    triggerAllNotifications({ 
        id: 'test', 
        name: 'Audio Check', 
        city: 'System', 
        created_at: new Date().toISOString() 
    });
  };

  return (
    <>
      {/* 🔴 INSTALL & PERMISSION WARNING (Mobile Only) */}
      {!audioUnlocked && (
         <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-xs p-2 text-center z-[10000] animate-pulse cursor-pointer">
           ⚠️ <b>Tap anywhere on screen</b> to enable Sound!
         </div>
      )}

      {/* 🟢 In-App Banner */}
      {alert.show && alert.lead && (
        <div className="fixed top-4 left-2 right-2 z-[9999] animate-slideDown">
          <div className="bg-green-600 text-white p-4 rounded-xl shadow-2xl flex justify-between items-center">
            <div>
              <p className="font-bold text-lg">New Lead Received!</p>
              <p>{alert.lead.name}</p>
              <p className="text-xs opacity-80">{alert.lead.city}</p>
            </div>
            <button onClick={() => setAlert({ show: false, lead: null })}>
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* 🛠️ TEST BUTTON (Only visible if sound is locked or permission missing) */}
      <div className="fixed bottom-20 right-4 z-50">
        <button 
            onClick={handleTest}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg flex items-center gap-2"
        >
            <Smartphone size={20} /> Test Alert
        </button>
      </div>
    </>
  );
};

export default LeadAlert;
