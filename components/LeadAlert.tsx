// src/components/LeadAlert.tsx

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../auth/useAuth';
import { useNotification } from '../hooks/useNotification';
import { X, Bell, BellOff, Volume2, VolumeX } from 'lucide-react';

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

  // Pre-load audio
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3'); // Put audio in public folder
    audioRef.current.preload = 'auto';
    audioRef.current.volume = 0.7;
    
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
          console.log('🔊 Audio unlocked');
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

  // Show permission banner if needed
  useEffect(() => {
    if (isSupported && permission === 'default') {
      setShowPermissionBanner(true);
    }
  }, [isSupported, permission]);

  // Subscribe to Supabase Realtime
  useEffect(() => {
    if (!session?.user) return;

    console.log('📡 Setting up Supabase subscription...');

    const channel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'leads' 
        },
        async (payload) => {
          console.log('📩 New lead received:', payload.new);
          const lead = payload.new as Lead;
          
          // Trigger all notifications
          await triggerAllNotifications(lead);
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    return () => {
      console.log('📡 Cleaning up subscription...');
      supabase.removeChannel(channel);
    };
  }, [session, permission, isReady, soundEnabled]);

  // Trigger all notification types
  const triggerAllNotifications = async (lead: Lead) => {
    // 1. Play Sound
    if (soundEnabled && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        console.log('🔊 Sound played');
      } catch (e) {
        console.warn('🔇 Sound failed:', e);
      }
    }

    // 2. Show In-App Alert
    setAlert({ show: true, lead });

    // 3. Vibrate (if supported)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    // 4. Show System Notification (Status Bar)
    if (permission === 'granted' && isReady) {
      const success = await showNotification(
        '🔥 New Lead Received!',
        {
          body: `${lead.name}${lead.city ? ` from ${lead.city}` : ''}`,
          icon: '/icon-192.png',
          tag: `lead-${lead.id}`,
          url: `/leads/${lead.id}`,
          leadId: lead.id
        }
      );
      
      if (success) {
        console.log('✅ System notification shown');
      } else {
        console.warn('❌ System notification failed');
      }
    } else {
      console.warn('⚠️ Cannot show system notification:', { permission, isReady });
    }

    // Auto-hide in-app alert after 8 seconds
    setTimeout(() => {
      setAlert(prev => prev.lead?.id === lead.id ? { show: false, lead: null } : prev);
    }, 8000);
  };

  // Handle permission request (on button click)
  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      setShowPermissionBanner(false);
      // Show test notification
      await showNotification('🎉 Notifications Enabled!', {
        body: 'You will now receive lead alerts',
        tag: 'test'
      });
    }
  };

  const dismissAlert = () => {
    setAlert({ show: false, lead: null });
  };

  return (
    <>
      {/* Permission Banner */}
      {showPermissionBanner && (
        <div className="fixed top-4 left-4 right-4 z-[9999] bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl shadow-2xl animate-slideDown">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 animate-bounce" />
              <div>
                <p className="font-semibold">Enable Notifications</p>
                <p className="text-sm text-indigo-200">
                  Get instant alerts when new leads arrive
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEnableNotifications}
                className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                Enable
              </button>
              <button
                onClick={() => setShowPermissionBanner(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Lead Alert */}
      {alert.show && alert.lead && (
        <div className="fixed top-4 left-4 right-4 z-[9998] animate-slideDown">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🔥</span>
                </div>
                <div>
                  <p className="font-bold text-lg">New Lead!</p>
                  <p className="text-green-100">{alert.lead.name}</p>
                  {alert.lead.city && (
                    <p className="text-sm text-green-200">📍 {alert.lead.city}</p>
                  )}
                </div>
              </div>
              <button
                onClick={dismissAlert}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debug Panel (Remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white p-3 rounded-lg text-xs space-y-1">
          <div>SW: {isReady ? '✅ Ready' : '⏳ Loading'}</div>
          <div>Permission: {permission}</div>
          <div>Supported: {isSupported ? '✅' : '❌'}</div>
          <button
            onClick={() => setSoundEnabled(s => !s)}
            className="flex items-center gap-1 text-gray-400 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            Sound
          </button>
        </div>
      )}
    </>
  );
};

export default LeadAlert;
