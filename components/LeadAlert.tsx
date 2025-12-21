import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { useNotification } from '../hooks/useNotification';
import { X, Bell, Volume2, VolumeX } from 'lucide-react';

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

// 🔔 Online Sound Link (Mixkit - Professional Ping)
const ONLINE_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

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
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);

  // 1. Pre-load Audio from Online URL
  useEffect(() => {
    // Local file ki jagah Online URL use kar rahe hain
    audioRef.current = new Audio(ONLINE_SOUND_URL); 
    audioRef.current.preload = 'auto';
    audioRef.current.volume = 1.0; // Volume Full
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 2. Unlock Audio on First Interaction (Android/iOS requirement)
  useEffect(() => {
    const unlockAudio = () => {
      if (!audioUnlockedRef.current && audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current!.pause();
          audioRef.current!.currentTime = 0;
          audioUnlockedRef.current = true;
          console.log('🔊 Audio system unlocked');
        }).catch((e) => console.log("Audio unlock silently failed (normal)", e));
      }
    };

    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // 3. Check Permissions
  useEffect(() => {
    if (isSupported && permission === 'default') {
      setShowPermissionBanner(true);
    }
  }, [isSupported, permission]);

  // 4. Supabase Realtime Listener
  useEffect(() => {
    if (!session?.user) return;

    console.log('📡 Connecting to Supabase Realtime...');

    const channel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'leads'
          // Note: Filter hata diya hai taaki aap easily test kar sako
        },
        async (payload) => {
          console.log('📩 New lead received!', payload.new);
          const lead = payload.new as Lead;
          await triggerAllNotifications(lead);
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime Status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, permission, isReady, soundEnabled]);

  // 5. Trigger Notifications (Sound + Popup + Mobile Bar)
  const triggerAllNotifications = async (lead: Lead) => {
    // A. Play Sound
    if (soundEnabled && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        console.log('🔊 Sound played successfully');
      } catch (e) {
        console.warn('🔇 Sound play failed:', e);
      }
    }

    // B. Show In-App Banner
    setAlert({ show: true, lead });

    // C. Vibrate Phone
    if ('vibrate' in navigator) {
      try { navigator.vibrate([200, 100, 200]); } catch(e) {}
    }

    // D. Show System Notification (Mobile Status Bar)
    if (permission === 'granted' && isReady) {
      const success = await showNotification(
        '🔥 New Lead Received!',
        {
          body: `${lead.name} from ${lead.city || 'Website'}`,
          icon: '/vite.svg', // Icon path
          tag: `lead-${lead.id}`,
          url: '/', // Click karne par app khulega
          leadId: lead.id
        }
      );
      console.log(success ? '✅ System notification sent' : '❌ System notification failed');
    }

    // Auto-hide In-App Alert after 8 seconds
    setTimeout(() => {
      setAlert(prev => prev.lead?.id === lead.id ? { show: false, lead: null } : prev);
    }, 8000);
  };

  // Handle Enable Button
  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      setShowPermissionBanner(false);
      // Test Sound
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log(e));
      }
      await showNotification('🎉 Notifications Active!', {
        body: 'You are ready to receive leads.',
        tag: 'test'
      });
    }
  };

  return (
    <>
      {/* 🟢 Permission Banner (Top) - Only shows if not allowed yet */}
      {showPermissionBanner && (
        <div className="fixed top-0 left-0 w-full z-[9999] bg-indigo-600 text-white p-3 shadow-lg animate-slideDown">
          <div className="flex items-center justify-between max-w-4xl mx-auto px-2">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-sm">Enable Lead Alerts</p>
                <p className="text-xs text-indigo-100">Don't miss new customers!</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEnableNotifications}
                className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-xs font-bold shadow-sm"
              >
                ALLOW
              </button>
              <button
                onClick={() => setShowPermissionBanner(false)}
                className="p-1.5 hover:bg-white/10 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 In-App Lead Alert (Floating Banner) */}
      {alert.show && alert.lead && (
        <div className="fixed top-4 left-0 w-full z-[9998] flex justify-center pointer-events-none">
          <div className="pointer-events-auto w-[92%] max-w-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-2xl shadow-2xl animate-bounce-in border-2 border-green-400/30">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-inner">
                  <span className="text-xl">🔥</span>
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight">New Lead!</p>
                  <p className="font-medium text-white/90">{alert.lead.name}</p>
                  <p className="text-xs text-green-100 mt-0.5">
                     📍 {alert.lead.city || 'India'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAlert({ show: false, lead: null })}
                className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛠️ Debug Panel (Optional - Development Mode Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-2 right-2 z-50 bg-black/80 text-white p-2 rounded text-[10px] backdrop-blur-sm">
           Status: {isReady ? '✅ Ready' : '⏳ Loading'} | Perm: {permission}
        </div>
      )}
    </>
  );
};

export default LeadAlert;
