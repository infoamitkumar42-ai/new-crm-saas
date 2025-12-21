import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { useNotification } from '../hooks/useNotification'; // Old hook
import { usePushNotification } from '../hooks/usePushNotification'; // 👇 New Hook
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

const ONLINE_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export const LeadAlert: React.FC = () => {
  const { session } = useAuth();
  // 👇 New Hook ka use
  const { subscribeToPush, loading } = usePushNotification();
  
  // Old logic setup...
  const { permission, isSupported, isReady, requestPermission, showNotification } = useNotification();
  const [alert, setAlert] = useState<AlertState>({ show: false, lead: null });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);

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

  useEffect(() => {
    const unlockAudio = () => {
      if (!audioUnlockedRef.current && audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current!.pause();
          audioRef.current!.currentTime = 0;
          audioUnlockedRef.current = true;
        }).catch((e) => console.log("Audio silent fail", e));
      }
    };
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' },
        async (payload) => {
          const lead = payload.new as Lead;
          await triggerAllNotifications(lead);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, permission, isReady, soundEnabled]);

  const triggerAllNotifications = async (lead: Lead) => {
    if (soundEnabled && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      } catch (e) {}
    }
    setAlert({ show: true, lead });
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    
    // Old System Notification Logic (Keep as backup)
    if (permission === 'granted' && isReady) {
      showNotification('🔥 New Lead!', {
        body: `${lead.name} from ${lead.city || 'Website'}`,
        icon: '/vite.svg',
        tag: `lead-${lead.id}`,
        url: '/',
        leadId: lead.id
      });
    }
    setTimeout(() => {
      setAlert(prev => prev.lead?.id === lead.id ? { show: false, lead: null } : prev);
    }, 8000);
  };

  return (
    <>
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
                  <p className="text-xs text-green-100 mt-0.5">📍 {alert.lead.city || 'India'}</p>
                </div>
              </div>
              <button onClick={() => setAlert({ show: false, lead: null })} className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👇 ENABLE BUTTON FOR BACKGROUND PUSH */}
      <div className="fixed bottom-24 right-4 z-50">
        <button 
            onClick={() => session?.user?.id && subscribeToPush(session.user.id)}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-3 rounded-full shadow-lg font-bold flex items-center gap-2"
        >
            <Smartphone size={20} />
            {loading ? 'Activating...' : 'Enable Background Push'}
        </button>
      </div>
    </>
  );
};

export default LeadAlert;
